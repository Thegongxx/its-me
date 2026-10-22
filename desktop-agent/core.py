"""Privacy boundary: no process names, titles, paths or arbitrary strings in payloads."""
from __future__ import annotations
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

CATEGORIES = frozenset({"development", "design", "reading", "writing", "other", "none"})
STATES = frozenset({"active", "idle", "paused", "focusing", "thinking", "available", "away"})
MANUAL_STATES = frozenset({"focusing", "thinking", "available", "away"})
TOKEN_PATTERN = re.compile(r"bl_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f]{64}\Z")

def endpoint(site_url: str, allow_local_http: bool = False) -> str:
    parsed = urlsplit(site_url.strip())
    local = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
    if not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in {"", "/"}:
        raise ValueError("网站地址必须是完整域名，不包含账号、路径、查询参数或片段")
    if parsed.scheme != "https" and not (allow_local_http and local and parsed.scheme == "http"):
        raise ValueError("必须使用 HTTPS；仅显式开发模式允许本机 HTTP")
    return site_url.strip().rstrip("/") + "/api/device/heartbeat"

@dataclass
class Config:
    site_url: str
    allow_local_http: bool = False
    whitelist: dict[str, str] = field(default_factory=dict)
    idle_seconds: int = 300
    heartbeat_seconds: int = 30
    poll_seconds: int = 2
    paused: bool = True
    manual_state: str | None = None

    @classmethod
    def load(cls, path: Path) -> "Config":
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict): raise ValueError("配置必须是 JSON 对象")
        result = cls(**raw)
        if type(result.allow_local_http) is not bool or type(result.paused) is not bool:
            raise ValueError("暂停和开发开关必须是布尔值")
        endpoint(result.site_url, result.allow_local_http)
        for value, minimum, maximum in [(result.idle_seconds, 30, 3600), (result.heartbeat_seconds, 15, 40), (result.poll_seconds, 1, 10)]:
            if type(value) is not int or not minimum <= value <= maximum: raise ValueError("采集间隔不在允许范围内")
        if not isinstance(result.whitelist, dict): raise ValueError("应用白名单必须是对象")
        for process, category in result.whitelist.items():
            if not isinstance(process, str) or not re.fullmatch(r"[a-zA-Z0-9_. -]+\.exe", process) or category not in CATEGORIES - {"none"}:
                raise ValueError("白名单只能包含 exe 文件名和允许的类别，不允许文件路径")
        result.whitelist = {k.lower(): v for k, v in result.whitelist.items()}
        if result.manual_state is not None and result.manual_state not in MANUAL_STATES: raise ValueError("手动状态无效")
        return result

    def save(self, path: Path) -> None:
        atomic_json(path, self.__dict__)

def atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)

def public_activity(config: Config, process_name: str | None, idle_seconds: float) -> tuple[str, str]:
    if config.paused: return "none", "paused"
    if config.manual_state == "away": return "none", "away"
    if idle_seconds >= config.idle_seconds: return "none", "idle"
    if not process_name: return "none", "away"
    # A non-allowlisted process never reveals its name, and is never inferred from its title.
    category = config.whitelist.get(process_name.lower(), "none")
    return category, config.manual_state or "active"

def payload(sequence: int, category: str, state: str) -> dict[str, int | str]:
    if type(sequence) is not int or not 0 <= sequence <= 9007199254740991: raise ValueError("序号超出范围")
    if category not in CATEGORIES or state not in STATES: raise ValueError("状态或类别不被允许")
    return {"sequence": sequence, "category": "none" if state in {"paused", "idle", "away"} else category, "state": state}

class Sequence:
    """Reserve and persist before sending: restarts/retries cannot replay a prior sequence."""
    def __init__(self, path: Path):
        self.path = path
        if path.exists():
            raw = json.loads(path.read_text(encoding="utf-8"))
            self.value = raw["sequence"]
            if type(self.value) is not int or self.value < 0: raise ValueError("设备序号损坏，请重新配置凭证")
        else: self.value = 0

    def next(self) -> int:
        candidate = self.value + 1
        if candidate > 9007199254740991: raise ValueError("请更换设备凭证")
        atomic_json(self.path, {"sequence": candidate})
        self.value = candidate
        return candidate

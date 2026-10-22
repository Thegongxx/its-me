"""Xuan Windows tray agent. Starts paused; no telemetry until the owner resumes."""
from __future__ import annotations
import argparse
import getpass
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import sys
import threading
import time

from core import Config, Sequence, TOKEN_PATTERN, payload, public_activity
from transport import Sender
from windows import InstanceLock, data_directory, foreground_process, idle_seconds, protect, require_windows, set_startup, unprotect

class Agent:
    def __init__(self, directory: Path):
        self.directory = directory
        self.config_path = directory / "config.json"
        self.config = Config.load(self.config_path)
        self.sender = Sender(self.config.site_url, unprotect((directory / "credential.bin").read_bytes()), self.config.allow_local_http)
        self.sequence = Sequence(directory / "sequence.json")
        self.stop_event, self.wake = threading.Event(), threading.Event()
        self.lock = threading.RLock()
        self.last_activity: tuple[str, str] | None = ("none", "paused") if self.config.paused else None
        self.last_sent = 0.0
        self.auth_failed = False
        self.display_status = "已暂停共享" if self.config.paused else "等待连接"
        self.icon = None
        self.logger = logging.getLogger("buildlog-agent")
        self.logger.setLevel(logging.INFO)
        handler = RotatingFileHandler(directory / "agent.log", maxBytes=65536, backupCount=2, encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
        self.logger.addHandler(handler)

    def update(self, **changes):
        with self.lock:
            if self.auth_failed and changes.get("paused") is False:
                self.display_status = "凭证不可用，请重新配置后重启"
                return
            for key, value in changes.items(): setattr(self.config, key, value)
            self.config.save(self.config_path)
            self.display_status = "正在暂停共享" if self.config.paused else "正在连接"
        self.wake.set()
        if self.icon: self.icon.update_menu()

    def reload_whitelist(self):
        try:
            replacement = Config.load(self.config_path)
            with self.lock:
                # Endpoint and credentials only change through configure + restart, never hot reload.
                self.config.whitelist = replacement.whitelist
                self.config.idle_seconds = replacement.idle_seconds
                self.config.heartbeat_seconds = replacement.heartbeat_seconds
                self.config.poll_seconds = replacement.poll_seconds
            self.display_status = "白名单已重载"
            self.wake.set()
        except (ValueError, TypeError, OSError): self.display_status = "配置格式无效，请检查本地配置"
        if self.icon: self.icon.update_menu()

    def loop(self):
        retry_at = 0.0
        while not self.stop_event.is_set():
            try:
                with self.lock:
                    config = self.config
                    paused = config.paused
                    # Paused agents do not even inspect the foreground process.
                    activity = ("none", "paused") if paused else public_activity(config, foreground_process(), idle_seconds())
                    heartbeat_interval, poll_interval = config.heartbeat_seconds, config.poll_seconds
                current = time.monotonic()
                due = activity != self.last_activity or (not paused and current - self.last_sent >= heartbeat_interval)
                if due and not self.auth_failed and current >= retry_at and current - self.last_sent >= 3.1:
                    code = self.sender.send(payload(self.sequence.next(), *activity))
                    if code == 200:
                        self.last_activity = activity
                        self.last_sent = time.monotonic()
                        self.display_status = "已暂停共享" if paused else "状态已同步"
                        retry_at = 0.0
                    elif code == 401:
                        self.auth_failed = True
                        self.update(paused=True)
                        self.display_status = "凭证已撤销或过期，请重新配置"
                        self.logger.info("Credential rejected; reporting stopped")
                    else:
                        retry_at = time.monotonic() + (4 if code == 429 else 30)
                        self.display_status = "服务端共享未启用或序号冲突" if code == 409 else "连接中断，稍后重试"
                        self.logger.info("Report not accepted (HTTP %s)", code)
                    if self.icon:
                        self.icon.title = "Xuan · " + self.display_status
                        self.icon.update_menu()
            except Exception:
                # Do not expose process names, credentials or arbitrary OS errors to logs.
                self.display_status = "采集暂时不可用，稍后重试"
                self.logger.info("Local collection failed; no private data recorded")
                retry_at = time.monotonic() + 30
                poll_interval = 5
            self.wake.wait(poll_interval)
            self.wake.clear()

    def quit(self, icon, item):
        # Best effort pause is dispatched by the worker; no network call blocks the tray UI.
        self.update(paused=True)
        def finish():
            deadline = time.monotonic() + 5
            while time.monotonic() < deadline and self.last_activity != ("none", "paused"):
                time.sleep(.1)
            self.stop_event.set(); self.wake.set(); icon.stop()
        threading.Thread(target=finish, daemon=True).start()

    def run(self):
        import os
        import pystray
        from PIL import Image, ImageDraw
        image = Image.new("RGBA", (64, 64), (212, 245, 98, 255))
        draw = ImageDraw.Draw(image)
        draw.line([(16,14),(48,50)], fill="#252823", width=8)
        draw.line([(48,14),(16,50)], fill="#252823", width=8)
        manual_names = {"focusing": "专注中", "thinking": "思考中", "available": "可以交流", "away": "暂时离开"}
        manual_items = [pystray.MenuItem("自动状态", lambda icon, item: self.update(manual_state=None), checked=lambda item: self.config.manual_state is None, radio=True)]
        for state, label in manual_names.items():
            # Factories keep callbacks at the two-argument signature pystray requires.
            def action_for(value): return lambda icon, item: self.update(manual_state=value)
            def checked_for(value): return lambda item: self.config.manual_state == value
            manual_items.append(pystray.MenuItem(label, action_for(state), checked=checked_for(state), radio=True))
        menu = pystray.Menu(
            pystray.MenuItem(lambda item: self.display_status, None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lambda item: "恢复共享" if self.config.paused else "暂停共享", lambda icon, item: self.update(paused=not self.config.paused), default=True),
            pystray.MenuItem("手动状态", pystray.Menu(*manual_items)),
            pystray.MenuItem("编辑应用白名单", lambda icon, item: os.startfile(str(self.config_path))),
            pystray.MenuItem("重载应用白名单", lambda icon, item: self.reload_whitelist()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("退出采集器", self.quit),
        )
        self.icon = pystray.Icon("build-log", image, "Xuan · " + self.display_status, menu)
        worker = threading.Thread(target=self.loop, daemon=True)
        worker.start()
        try: self.icon.run()
        finally: self.stop_event.set(); self.wake.set(); worker.join(timeout=12)

def configure(directory: Path, allow_local: bool):
    require_windows()
    guard = InstanceLock(directory)
    try:
        site = input("网站完整地址（HTTPS）：").strip()
        token = getpass.getpass("设备凭证（输入不会显示）：").strip()
        if not TOKEN_PATTERN.fullmatch(token): raise ValueError("设备凭证格式错误")
        config = Config(site_url=site, allow_local_http=allow_local)
        # Validate before writing. Default allowlist is empty and sharing starts paused.
        from core import endpoint
        endpoint(config.site_url, config.allow_local_http)
        directory.mkdir(parents=True, exist_ok=True)
        encrypted = protect(token)
        (directory / "credential.bin").write_bytes(encrypted)
        config.save(directory / "config.json")
        print("配置完成。凭证已通过 Windows 当前用户 DPAPI 加密。")
        print("默认暂停，白名单为空。请编辑以下文件，再从托盘恢复共享：")
        print(directory / "config.json")
        print("序号保留，避免重复配置相同凭证导致心跳被拒绝。")
    finally: guard.close()

def main():
    parser = argparse.ArgumentParser(description="Xuan privacy-first Windows tray agent")
    parser.add_argument("--config-dir", type=Path, default=data_directory())
    parser.add_argument("command", choices=["configure", "run", "install-startup", "uninstall-startup", "doctor"])
    parser.add_argument("--allow-local-http", action="store_true", help="仅开发调试时允许 localhost HTTP")
    args = parser.parse_args()
    require_windows()
    if args.command == "configure": configure(args.config_dir, args.allow_local_http)
    elif args.command == "doctor":
        # No network and no process names printed; verifies actual local Win32 APIs only.
        process = foreground_process()
        idle = idle_seconds()
        roundtrip = unprotect(protect("build-log-self-test")) == "build-log-self-test"
        print(f"Windows APIs: {'OK' if process is not None else 'foreground unavailable (safe fallback)'}")
        print(f"Idle API: {'OK' if idle >= 0 else 'ERROR'}")
        print(f"DPAPI roundtrip: {'OK' if roundtrip else 'ERROR'}")
        print("No telemetry sent. No startup entry changed.")
    elif args.command in {"install-startup", "uninstall-startup"}:
        set_startup(args.command == "install-startup", Path(__file__), args.config_dir)
        print("当前用户登录启动项已" + ("添加。" if args.command == "install-startup" else "移除。"))
    else:
        guard = InstanceLock(args.config_dir)
        try: Agent(args.config_dir).run()
        finally: guard.close()

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: pass
    except Exception as exc:
        # Public generic errors only. Never dump traceback, HTTP headers or credential values.
        if sys.stderr is not None: print(f"采集器未启动（{type(exc).__name__}）。请检查本地配置或重新运行 configure。", file=sys.stderr)
        sys.exit(1)

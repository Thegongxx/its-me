"""HTTPS only by default; redirects are rejected so Authorization cannot leak to another host."""
from __future__ import annotations
import json
import ssl
from urllib import error, request
from core import TOKEN_PATTERN, endpoint, payload as validated_payload

class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise error.HTTPError(req.full_url, code, "Redirect refused", headers, fp)

class Sender:
    def __init__(self, site_url: str, token: str, allow_local_http: bool = False):
        if not TOKEN_PATTERN.fullmatch(token): raise ValueError("设备凭证格式不正确")
        self.url = endpoint(site_url, allow_local_http)
        self.token = token
        self.opener = request.build_opener(NoRedirect(), request.HTTPSHandler(context=ssl.create_default_context()))

    def send(self, payload: dict) -> int:
        if set(payload) != {"sequence", "category", "state"}: raise ValueError("拒绝上传非公开字段")
        payload = validated_payload(payload["sequence"], payload["category"], payload["state"])
        # Never log the request, header, plaintext token, payload, or exception representation.
        req = request.Request(self.url, data=json.dumps(payload, separators=(",", ":")).encode(), headers={"Content-Type": "application/json", "Authorization": "Bearer " + self.token, "User-Agent": "BuildLogAgent/0.1"}, method="POST")
        try:
            with self.opener.open(req, timeout=10) as response:
                response.read(4096)
                return response.status
        except error.HTTPError as response:
            code = response.code
            response.close()
            return code
        except (error.URLError, TimeoutError, OSError):
            return 0

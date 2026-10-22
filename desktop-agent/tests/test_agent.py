import json
from pathlib import Path
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import unittest
from unittest.mock import Mock, patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core import Config, Sequence, endpoint, payload, public_activity
from transport import Sender

TOKEN = "bl_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa." + "1" * 64

class PrivacyTests(unittest.TestCase):
    def test_paused_always_hides_category(self):
        self.assertEqual(public_activity(Config("https://example.org", whitelist={"code.exe":"development"}), "code.exe", 0), ("none", "paused"))

    def test_only_allowlisted_process_maps_to_a_category(self):
        config = Config("https://example.org", paused=False, whitelist={"code.exe":"development"})
        self.assertEqual(public_activity(config, "CODE.EXE", 0), ("development", "active"))
        for process in ["chrome.exe", "private-chat.exe", "my-secret.exe"]:
            self.assertEqual(public_activity(config, process, 0), ("none", "active"))

    def test_idle_and_unavailable_foreground_remove_category(self):
        config = Config("https://example.org", paused=False, whitelist={"code.exe":"development"})
        self.assertEqual(public_activity(config, "code.exe", 300), ("none", "idle"))
        self.assertEqual(public_activity(config, None, 0), ("none", "away"))

    def test_manual_state_is_bounded_and_respects_idle(self):
        config = Config("https://example.org", paused=False, manual_state="focusing", whitelist={"code.exe":"development"})
        self.assertEqual(public_activity(config, "code.exe", 0), ("development", "focusing"))
        self.assertEqual(public_activity(config, "code.exe", 400), ("none", "idle"))
        config.manual_state = "away"
        self.assertEqual(public_activity(config, "code.exe", 0), ("none", "away"))

    def test_exact_public_payload_contract(self):
        self.assertEqual(payload(4, "development", "active"), {"sequence":4,"category":"development","state":"active"})
        self.assertEqual(payload(5, "development", "paused")["category"], "none")
        for sequence in [-1, True, 1.5, 9007199254740992]:
            with self.assertRaises(ValueError): payload(sequence, "none", "active")
        with self.assertRaises(ValueError): payload(1, "secret window title", "active")

    def test_url_transport_boundary(self):
        self.assertEqual(endpoint("https://example.org/"), "https://example.org/api/device/heartbeat")
        for url in ["http://example.org", "https://user:pass@example.org", "https://example.org/?secret=1", "https://example.org/path", "file:///private", "https://example.org/#x"]:
            with self.assertRaises(ValueError): endpoint(url, True)
        with self.assertRaises(ValueError): endpoint("http://127.0.0.1:3000")
        self.assertEqual(endpoint("http://127.0.0.1:3000", True), "http://127.0.0.1:3000/api/device/heartbeat")

    def test_sequences_are_reserved_before_send_and_survive_restarts(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sequence.json"
            seq = Sequence(path)
            self.assertEqual(seq.next(), 1)
            self.assertEqual(json.loads(path.read_text())["sequence"], 1)
            self.assertEqual(Sequence(path).next(), 2)

    def test_corrupt_sequence_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sequence.json"; path.write_text('{"sequence":"bad"}')
            with self.assertRaises(ValueError): Sequence(path)

    def test_config_rejects_paths_invalid_categories_and_interval(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            for override in [{"whitelist":{"C:/secret/code.exe":"development"}}, {"whitelist":{"code.exe":"private"}}, {"heartbeat_seconds":100}, {"paused":"false"}, {"manual_state":"arbitrary private text"}]:
                path.write_text(json.dumps({"site_url":"https://example.org", **override}), encoding="utf-8")
                with self.assertRaises((ValueError, TypeError)): Config.load(path)

    def test_paused_loop_neither_samples_nor_sends(self):
        from agent import Agent
        agent = Agent.__new__(Agent)
        agent.config = Config("https://example.org")
        agent.last_activity = ("none", "paused"); agent.auth_failed = False
        agent.last_sent = 0; agent.stop_event = threading.Event(); agent.lock = threading.RLock()
        agent.wake = Mock(); agent.wake.wait.side_effect = lambda timeout: agent.stop_event.set()
        agent.sender = Mock(); agent.logger = Mock()
        with patch("agent.foreground_process", side_effect=AssertionError("must not sample")) as sample:
            agent.loop()
            sample.assert_not_called(); agent.sender.send.assert_not_called(); agent.logger.info.assert_not_called()

class TransportTests(unittest.TestCase):
    def setUp(self):
        self.requests = []; self.redirect = False
        owner = self
        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                owner.requests.append({"path":self.path,"authorization":self.headers.get("Authorization"),"body":json.loads(self.rfile.read(int(self.headers["Content-Length"])))})
                if owner.redirect:
                    self.send_response(307); self.send_header("Location", "/must-not-follow")
                else: self.send_response(200)
                self.end_headers(); self.wfile.write(b'{}')
            def log_message(self, *args): pass
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True); self.thread.start()
        self.sender = Sender(f"http://127.0.0.1:{self.server.server_port}", TOKEN, True)
    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
    def test_wire_contains_only_safe_fields(self):
        self.assertEqual(self.sender.send(payload(1, "design", "active")), 200)
        self.assertEqual(self.requests[0]["path"], "/api/device/heartbeat")
        self.assertEqual(set(self.requests[0]["body"]), {"sequence","category","state"})
        self.assertEqual(self.requests[0]["authorization"], "Bearer " + TOKEN)
    def test_refuses_redirect_to_protect_bearer(self):
        self.redirect = True
        self.assertEqual(self.sender.send(payload(1, "none", "idle")), 307)
        self.assertEqual(len(self.requests), 1)
    def test_extra_fields_never_reach_the_network(self):
        with self.assertRaises(ValueError): self.sender.send({**payload(1,"none","active"),"window_title":"private"})
        self.assertEqual(self.requests, [])

@unittest.skipUnless(sys.platform == "win32", "Win32 verification only")
class WindowsTests(unittest.TestCase):
    def test_dpapi_uses_encrypted_bytes_and_roundtrips_current_user(self):
        from windows import protect, unprotect
        cipher = protect(TOKEN)
        self.assertNotIn(TOKEN.encode(), cipher)
        self.assertEqual(unprotect(cipher), TOKEN)
    def test_win32_idle_api(self):
        from windows import idle_seconds
        self.assertGreaterEqual(idle_seconds(), 0)
    def test_win32_foreground_reduces_to_filename_only(self):
        from windows import foreground_process
        process = foreground_process()
        if process is not None:
            self.assertNotIn("\\", process); self.assertNotIn("/", process)
    def test_single_instance_prevents_sequence_races(self):
        from windows import InstanceLock
        with tempfile.TemporaryDirectory() as directory:
            lock = InstanceLock(Path(directory))
            try:
                with self.assertRaises(RuntimeError): InstanceLock(Path(directory))
            finally: lock.close()

if __name__ == "__main__": unittest.main()

import http.client, json, sys, tempfile, threading, unittest
from pathlib import Path
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import Handler, Workspace


class LocalBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.http = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.http.workspace = Workspace(Path(cls.tmp.name) / "vault")
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.thread.join()
        cls.tmp.cleanup()

    def call(self, path, method="GET", headers=None, payload=None):
        c = http.client.HTTPConnection("127.0.0.1", self.http.server_port)
        c.request(
            method,
            path,
            json.dumps(payload) if payload is not None else None,
            headers or {},
        )
        r = c.getresponse()
        out = r.status, r.read()
        c.close()
        return out

    def test_foreign_host(self):
        self.assertEqual(
            self.call("/api/session", headers={"Host": "third-party.example"})[0], 403
        )

    def test_foreign_origin(self):
        self.assertEqual(
            self.call(
                "/api/status",
                "POST",
                {
                    "Origin": "https://third-party.example",
                    "Content-Type": "application/json",
                    "X-Product-Session": self.http.workspace.token,
                },
                {},
            )[0],
            403,
        )

    def test_missing_token(self):
        self.assertEqual(
            self.call(
                "/api/status",
                "POST",
                {
                    "Origin": f"http://127.0.0.1:{self.http.server_port}",
                    "Content-Type": "application/json",
                },
                {},
            )[0],
            403,
        )

    def test_only_public_assets_served(self):
        self.assertEqual(self.call("/../app.py")[0], 404)
        self.assertEqual(self.call("/workspace.json")[0], 404)

    def test_same_origin_session(self):
        status, body = self.call("/api/session")
        self.assertEqual(status, 200)
        self.assertIn("token", json.loads(body))

    def test_settings_write_with_nonce(self):
        status, _ = self.call(
            "/api/config",
            "POST",
            {
                "Origin": f"http://127.0.0.1:{self.http.server_port}",
                "Content-Type": "application/json",
                "X-Product-Session": self.http.workspace.token,
            },
            {"cap": 2},
        )
        self.assertEqual(status, 200)

"""Offline contract tests. All provider traffic is mocked."""

import json, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import Workspace
from providers import run_job, quote_job
from book_pdf import render_pdf


class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.ws = Workspace(Path(self.temp.name) / "private")
        self.base = {
            "track": "Ebook",
            "step": "launch-1",
            "notes": "A reviewed sample",
            "title": "Local sample",
            "price": "37",
            "stock": "2",
        }

    def quote(self, op, **kw):
        return self.ws.dispatch("quote", {**self.base, "op": op, **kw})

    def execute(self, q):
        return self.ws.dispatch("run", {"ticket": q["ticket"], "confirmed": True})

    def key(self, name):
        self.ws.dispatch(
            "key",
            {"name": name, "key": "fixture-only-fake-1234", "secret": "fictional"},
        )

    def test_secret_never_returned(self):
        self.key("Apify")
        s = json.dumps(self.ws.status())
        self.assertNotIn("fixture-only-fake", s)
        self.assertNotIn("fictional", s)
        self.assertIn("1234", s)
        self.ws.dispatch("key", {"name": "Apify", "remove": True})
        self.assertNotIn("Apify", self.ws.status()["keys"])

    def test_no_credentials(self):
        with self.assertRaisesRegex(ValueError, "key first"):
            self.quote("hidden")

    def test_confirmation_required(self):
        with self.assertRaisesRegex(ValueError, "Confirm"):
            self.ws.dispatch("run", {"ticket": "absent", "confirmed": False})

    def test_invalid_ticket(self):
        with self.assertRaisesRegex(ValueError, "expired"):
            self.ws.dispatch("run", {"ticket": "absent", "confirmed": True})

    def test_note_round_trip_and_separate_tracks(self):
        self.ws.dispatch("note", self.base)
        self.ws.dispatch(
            "note", {**self.base, "track": "Course", "notes": "A different class"}
        )
        saved = Workspace(self.ws.folder).status()["tracks"]
        self.assertEqual(saved["Ebook"]["results"]["launch-1"], "A reviewed sample")
        self.assertEqual(saved["Course"]["results"]["launch-1"], "A different class")

    def test_hidden_and_publication_are_distinct(self):
        self.key("Whop")
        q = self.quote("hidden")
        with patch(
            "providers.request",
            side_effect=[
                {"id": "prod_fixture"},
                {"id": "plan_fixture", "purchase_url": "https://whop.com/"},
            ],
        ) as mock:
            self.execute(q)
            calls = mock.call_args_list
            self.assertEqual(calls[0].args[4]["visibility"], "hidden")
            self.assertEqual(calls[1].args[4]["stock"], 0)
        with self.assertRaises(ValueError):
            self.execute(q)
        self.assertFalse(self.ws.status()["tracks"]["Ebook"]["visible"])
        with patch("providers.request", return_value={}) as mock:
            q = self.quote("publish")
            self.assertFalse(mock.called)
            self.execute(q)
            self.assertEqual(mock.call_args_list[-1].args[4]["stock"], 2)

    def test_cannot_publish_missing_listing(self):
        self.key("Whop")
        with self.assertRaisesRegex(ValueError, "hidden listing"):
            self.quote("publish")

    def test_robot_cap_and_one_shot_quote(self):
        self.key("Apify")
        self.ws.dispatch("config", {"cap": 0.5, "robotCap": 0.4})
        meta = {
            "data": {
                "pricingInfos": [
                    {"pricingModel": "PAY_PER_EVENT", "startedAt": "2020-01-01"}
                ]
            }
        }
        p = {**self.base, "actor": "example~fixture", "actorInput": "{}"}
        with patch("providers.request", return_value=meta):
            q = self.quote("robot", **p)
        with patch(
            "providers.request",
            side_effect=[
                {
                    "data": {
                        "status": "SUCCEEDED",
                        "id": "fixture",
                        "defaultDatasetId": "fixture",
                    }
                },
                [{"title": "Result"}],
            ],
        ) as mock:
            self.execute(q)
            self.assertIn("maxTotalChargeUsd=0.4", mock.call_args_list[0].args[2])
        with (
            patch("providers.request", return_value=meta),
            self.assertRaisesRegex(ValueError, "session cap"),
        ):
            self.quote("robot", **p)

    def test_no_unknown_robot_billing(self):
        self.key("Apify")
        with (
            patch("providers.request", return_value={"data": {"pricingInfos": []}}),
            self.assertRaisesRegex(ValueError, "pay-per-event"),
        ):
            self.quote("robot", actor="x~y", actorInput="{}")

    def test_paid_failure_preserves_previous_result(self):
        self.key("Higgsfield")
        self.ws.dispatch("note", self.base)
        with patch("providers.request", return_value={"usd": "0.2"}):
            q = self.quote("media", modelPath="higgsfield-ai/test", mediaInput="{}")
        with (
            patch("providers.request", side_effect=ValueError("Provider offline")),
            self.assertRaises(ValueError),
        ):
            self.execute(q)
        self.assertEqual(
            self.ws.status()["tracks"]["Ebook"]["results"]["launch-1"],
            "A reviewed sample",
        )
        self.assertEqual(self.ws.reserved, 0.2)

    def test_test_recipient_is_single_address(self):
        self.key("Instantly")
        self.ws.dispatch(
            "config", dict(name="Test", business="Example", address="Example address")
        )
        with self.assertRaisesRegex(ValueError, "one valid"):
            self.quote(
                "test",
                sender="sender@example.com",
                subject="Read me",
                body="Reviewed.",
                testTo="first@example.com,second@example.com",
            )

    def test_activation_needs_verified_leads(self):
        self.key("Instantly")
        self.ws.db["tracks"]["Ebook"] = {"campaignId": "fixture"}
        with self.assertRaisesRegex(ValueError, "checked leads"):
            self.quote("activate")

    def test_pdf_format(self):
        pdf = render_pdf(
            {
                "title": "Sample",
                "format": "Course",
                "units": [{"title": "Lesson", "text": "An edited lesson."}],
                "sources": [],
            }
        )
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertIn(b"An edited lesson.", pdf)
        self.assertIn(b"/MediaBox [0 0 432 648]", pdf)

    def test_invalid_numeric_limits(self):
        for n in ["nan", "-1", "inf"]:
            with self.assertRaises(ValueError):
                self.ws.dispatch("config", {"cap": n})

    def test_cross_campaign_replies_rejected(self):
        self.key("Instantly")
        self.ws.dispatch(
            "config", dict(name="Test", business="Example", address="Example address")
        )
        self.ws.db["tracks"]["Ebook"] = {
            "campaignId": "fixture",
            "replyIds": ["same-track"],
        }
        with self.assertRaisesRegex(ValueError, "matching reply"):
            self.quote(
                "payreply",
                sender="s@example.com",
                subject="Test",
                body="Reviewed",
                replyId="other-track",
                checkout="https://whop.com/checkout/x",
            )


if __name__ == "__main__":
    unittest.main()

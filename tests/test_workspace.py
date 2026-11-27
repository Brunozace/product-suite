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

    def test_guided_plan_requires_current_market_and_selected_buyer(self):
        payload = {"track": "Ebook", "step": "build-3", "op": "write", "guided": True,
                   "title": "Pencil practice", "notes": "", "instruction": "Plan"}
        with self.assertRaisesRegex(ValueError, "Choose an idea"):
            self.ws.dispatch("quote", payload.copy())
        track = self.ws.db["tracks"]["Ebook"]
        track["results"].update({"build-0": "Pencil practice", "build-2": "| Teachers |",
                                 "build-3": "Old outline"})
        track.update(research={"build-1": {"Retail": {"rows": [{"title": "Tracing sheets"}]}}},
                     buyer="Families")
        self.ws.dispatch("pickbuyer", dict(payload, step="build-2", buyer="Teachers"))
        self.assertFalse(self.ws.status()["tracks"]["Ebook"]["completedSteps"][3])
        with patch("app.quote_job", return_value=(0, "Review plan")) as quote:
            self.ws.dispatch("quote", payload.copy())
            self.assertIn("Teachers", quote.call_args.args[0]["instruction"])
        with self.assertRaisesRegex(ValueError, "Create the product plan"):
            self.ws.dispatch("quote", dict(payload, step="build-4", op="book"))
        self.ws.dispatch("note", dict(payload, step="build-0", notes="New topic", title="New topic"))
        self.assertEqual(self.ws.status()["tracks"]["Ebook"]["completedSteps"], [True]+[False]*6)

    def test_apply_reviewed_voice_preserves_remainder_and_allows_undo(self):
        t = {"results": {"build-0": "Idea", "build-3": "Plan", "build-6": "Offer"},
             "research": {"build-1": {"Evidence": {"rows": [{"title": "Market"}]}}},
             "buyer": "Teachers", "book": {"titles": ["One"], "units": {"0": "Opening. Rest."}},
             "voiceOriginal": "Opening.", "voiceReport": "## Adapted excerpt\nTry this."}
        self.ws.db["tracks"]["Ebook"] = t
        self.ws.dispatch("applyvoice", {"track": "Ebook", "step": "build-5"})
        self.assertEqual(t["book"]["units"]["0"], "Try this. Rest.")
        self.assertIn(6, t["staleSteps"])
        self.ws.dispatch("editunit", {"track": "Ebook", "step": "build-4", "unit": 0, "undo": True})
        self.assertEqual(t["book"]["units"]["0"], "Opening. Rest.")

    def test_switched_idea_uses_current_plan_without_previous_book_or_art(self):
        t={"title":"Apartment Checklist","buyer":"Renters","notes":{"build-4":"Old brief"},
           "results":{"build-0":"Apartment Checklist","build-2":"Renters","build-3":"Old school plan"},
           "research":{"build-1":{"Market":{"rows":[{"title":"Decluttering"}]}}},
           "book":{"title":"Pencil Practice","subtype":"Educational workbook","titles":["Tracing"],"units":{"0":"Trace"}},
           "coverId":"old-job","coverVersion":"old-cover","staleSteps":[3,4,5,6]}
        self.ws.db["tracks"]["Ebook"]=t
        view=self.ws.status()["tracks"]["Ebook"]
        self.assertNotIn("book",view)
        self.assertNotIn("build-3",view["results"])
        self.assertNotIn("coverVersion",view)
        self.assertEqual(view["suggestedSubtype"],"Checklist")
        self.ws.dispatch("saveplan",dict(track="Ebook",step="build-3",title=t["title"],buyer="Renters",report="## Outline\n1. Kitchen inventory"))
        view=self.ws.status()["tracks"]["Ebook"]
        self.assertEqual(view["results"]["build-3"],"## Outline\n1. Kitchen inventory")
        self.assertNotIn("build-4",view["notes"])
        self.assertTrue(view["completedSteps"][3])
        self.assertFalse(view["completedSteps"][4])
        self.assertEqual(t["previousPlans"],["Old school plan"])
        self.assertEqual(t["book"]["units"]["0"],"Trace")

    def test_higgsfield_accepts_full_key_and_legacy_pairs(self):
        for key, secret, credential in (
            ("fixture-key", "", "fixture-key"),
            ("fixture:combined", "", "fixture:combined"),
            ("fixture-id", "fixture-secret", "fixture-id:fixture-secret"),
        ):
            self.ws.dispatch("key", {"name": "Higgsfield", "key": key, "secret": secret})
            with patch("providers.send", return_value={"usd": 0}) as send:
                self.ws.dispatch("test", {"name": "Higgsfield"})
                self.assertEqual(send.call_args.args[2]["Authorization"], "Key " + credential)

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

    def test_market_batch_fits_remaining_session_budget(self):
        self.key("Apify")
        self.ws.reserved=5.0493
        with patch("providers.actor_pricing",return_value={}):
            q=self.quote("batch",step="build-1")
        payload=self.ws.tickets[q["ticket"]][1]
        self.assertEqual(payload["cost"],4.95)
        self.assertEqual([j["cost"] for j in payload["jobs"]],[.99]*5)
        self.assertIn("normally $1.00",q["description"])
        self.assertEqual(self.ws.reserved,5.0493)
        self.assertEqual(self.ws.db["config"]["robotCap"],1)
        with patch("providers.actor_pricing",return_value={}):
            reduced=self.quote("batch",step="build-1",batchLimit="1.00")
        self.assertEqual(self.ws.tickets[reduced["ticket"]][1]["cost"],1)
        self.ws.reserved=9.99
        with self.assertRaisesRegex(ValueError,"at least"):
            self.quote("batch",step="build-1")
        with self.assertRaisesRegex(ValueError,"session cap"):
            self.execute(reduced)

    def test_new_buyer_scores_visible_before_audience_selection(self):
        track={"staleSteps":[2,3,4,5,6],"needsBuyerScores":False,"results":{"build-2":"Current scored groups"},"buyer":"Previous buyer"}
        current=self.ws.public_track("Ebook",track)
        self.assertEqual(current["results"]["build-2"],"Current scored groups")
        self.assertNotIn("buyer",current)
        self.assertFalse(current["completedSteps"][2])
        track["needsBuyerScores"]=True
        self.assertNotIn("build-2",self.ws.public_track("Ebook",track)["results"])

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

    def test_email_lookup_accepts_only_confirmed_requested_profiles_and_reuses_checks(self):
        self.key("Apify")
        first = "https://www.linkedin.com/in/example-first"
        second = "https://www.linkedin.com/in/example-second"
        inputs = {"lookup": first + "\n" + second}
        pricing = {
            "pricingModel": "PAY_PER_EVENT",
            "pricingPerEvent": {"actorChargeEvents": {"person-email-confirmed": {"eventPriceUsd": 0.03}}},
        }
        confirmed = {
            "input": first, "email": "Work@example.com", "status": "confirmed",
            "mailboxConfirmed": True, "sendDecision": "send",
        }
        rows = [
            {**confirmed, "input": second, "status": "catch-all", "email": "guess@example.com"},
            {**confirmed, "input": "unrequested", "email": "other@example.com"},
            {**confirmed, "input": "", "linkedinUrl": first + "/"},
        ]
        with patch("providers.request", side_effect=[
            {"data": {"pricingInfos": [pricing]}},
            {"data": {"id": "run", "defaultDatasetId": "dataset", "status": "SUCCEEDED"}},
            rows,
        ]) as calls:
            quote = self.quote("verify", **inputs)
            self.assertIn("0.0600", quote["price"])
            self.execute(quote)
            request = calls.call_args_list[1].args
            self.assertEqual(request[1], "Apify")
            self.assertIn("maxTotalChargeUsd=0.06", request[2])
            self.assertEqual(request[4], {"linkedinUrls": [first, second], "smtpCheck": True})
            self.assertEqual(self.ws.status()["tracks"]["Ebook"]["verified"], ["work@example.com"])
            self.execute(self.quote("verify", **inputs))
            self.assertEqual(calls.call_count, 3)

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

"""Offline contracts for OpenAI drafting, model selection, and workspace upgrades."""

import json
import math
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import Workspace
from providers import DEFAULT_MODEL, OPENAI_MODELS, OUTPUT_LIMIT


class OpenAIWritingTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.folder = Path(tmp.name) / "suite"
        self.ws = Workspace(self.folder)
        self.ws.dispatch("key", {"name": "OpenAI", "key": "fixture-openai-only"})
        self.job = {
            "op": "write",
            "track": "Ebook",
            "step": "build-3",
            "title": "Outline",
            "notes": "Kitchen notebook",
            "instruction": "Write a plan.",
        }

    def test_all_models_quote_and_generate(self):
        for model, rates in OPENAI_MODELS.items():
            with self.subTest(model=model), patch("providers.send") as send:
                self.ws.dispatch("config", {"model": model})
                send.side_effect = [
                    {"input_tokens": 100},
                    {
                        "status": "completed",
                        "output": [
                            {"type": "reasoning", "summary": []},
                            {
                                "type": "message",
                                "content": [{"type": "output_text", "text": "Draft A"}],
                            },
                            {
                                "type": "message",
                                "content": [{"type": "output_text", "text": "Draft B"}],
                            },
                        ],
                    },
                ]
                q = self.ws.dispatch("quote", dict(self.job))
                ceiling = (
                    math.ceil(
                        ((100 + 64) * rates["input"] + OUTPUT_LIMIT * rates["output"])
                        / 100
                    )
                    / 10000
                )
                self.assertIn(f"{ceiling:.4f}", q["price"])
                self.assertIn(model, q["description"])
                self.assertEqual(send.call_count, 1)
                self.ws.dispatch("run", {"ticket": q["ticket"], "confirmed": True})
                count, generate = [c.args for c in send.call_args_list]
                self.assertEqual(
                    count[1], "https://api.openai.com/v1/responses/input_tokens"
                )
                self.assertEqual(generate[1], "https://api.openai.com/v1/responses")
                self.assertEqual(
                    generate[2]["Authorization"], "Bearer fixture-openai-only"
                )
                self.assertEqual(generate[4]["model"], model)
                self.assertEqual(count[4]["input"], generate[4]["input"])
                self.assertEqual(generate[4]["max_output_tokens"], OUTPUT_LIMIT)
                self.assertFalse(generate[4]["store"])
                self.assertEqual(
                    self.ws.db["tracks"]["Ebook"]["results"]["build-3"],
                    "Draft A\nDraft B",
                )

    def test_step_override_persists_and_can_inherit_default(self):
        s = {"track": "Ebook", "step": "build-3"}
        self.ws.dispatch("stepmodel", {**s, "model": "gpt-6.2-astra"})
        self.ws = Workspace(self.folder)
        with patch("providers.request", return_value={"input_tokens": 45}):
            self.assertIn(
                "gpt-6.2-astra",
                self.ws.dispatch("quote", dict(self.job))["description"],
            )
            self.ws.dispatch("stepmodel", {**s, "model": ""})
            self.assertIn(
                DEFAULT_MODEL, self.ws.dispatch("quote", dict(self.job))["description"]
            )
        with self.assertRaises(ValueError):
            self.ws.dispatch("config", {"model": "unpriced-model"})

    def test_incomplete_response_preserves_previous_draft(self):
        self.ws.dispatch("note", self.job)
        with patch(
            "providers.request",
            side_effect=[{"input_tokens": 50}, {"status": "incomplete", "output": []}],
        ):
            q = self.ws.dispatch("quote", dict(self.job))
            with self.assertRaisesRegex(ValueError, "did not complete"):
                self.ws.dispatch("run", {"ticket": q["ticket"], "confirmed": True})
        self.assertEqual(
            self.ws.db["tracks"]["Ebook"]["results"]["build-3"], self.job["notes"]
        )

    def test_legacy_workspace_migrates_models_without_reusing_keys(self):
        old = {
            "config": {"model": "claude-sonnet-4-6"},
            "keys": {"Claude": {"key": "legacy-fixture", "status": "Connected"}},
            "tracks": {
                "Ebook": {
                    "models": {"build-3": "claude-opus-4-6", "build-4": "fable"},
                    "results": {"build-3": "Existing work"},
                }
            },
        }
        self.ws.file.write_text(json.dumps(old), "utf8")
        self.ws = Workspace(self.folder)
        self.assertEqual(self.ws.status()["config"]["model"], DEFAULT_MODEL)
        self.assertEqual(self.ws.status()["keys"], {})
        self.assertEqual(
            self.ws.status()["tracks"]["Ebook"]["models"], {"build-4": "fable"}
        )
        self.assertEqual(
            self.ws.status()["tracks"]["Ebook"]["results"]["build-3"], "Existing work"
        )
        with (
            patch("providers.send") as send,
            self.assertRaisesRegex(ValueError, "OpenAI key first"),
        ):
            self.ws.dispatch("quote", dict(self.job))
        send.assert_not_called()

    def test_book_uses_confirmed_model_for_every_unit(self):
        job = {
            **self.job,
            "op": "book",
            "step": "build-4",
            "outline": "First unit\nSecond unit",
        }
        self.ws.dispatch("stepmodel", {**job, "model": "gpt-6.2-sol"})
        completed = {
            "status": "completed",
            "output": [
                {
                    "type": "message",
                    "content": [{"type": "output_text", "text": "Finished unit."}],
                }
            ],
        }
        with patch(
            "providers.request",
            side_effect=[
                {"input_tokens": 120},
                {"input_tokens": 130},
                completed,
                completed,
            ],
        ) as requests:
            q = self.ws.dispatch("quote", job)
            self.assertIn("gpt-6.2-sol", q["description"])
            self.ws.dispatch("run", {"ticket": q["ticket"], "confirmed": True})
        self.assertEqual(len(self.ws.db["tracks"]["Ebook"]["book"]["units"]), 2)
        self.assertTrue(
            all(
                call.args[4]["model"] == "gpt-6.2-sol"
                for call in requests.call_args_list
            )
        )

    def test_connection_test_only_lists_models(self):
        with patch("providers.send", return_value={"data": []}) as send:
            self.ws.dispatch("test", {"name": "OpenAI"})
            self.assertEqual(
                send.call_args.args[1:4],
                (
                    "https://api.openai.com/v1/models",
                    {"Authorization": "Bearer fixture-openai-only"},
                    "GET",
                ),
            )
        self.assertEqual(self.ws.status()["keys"]["OpenAI"]["status"], "Connected")

import json
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch
from pypdf import PdfReader

from app import Workspace
from page_builder import quote_pages, run_pages, quality, store_page
from page_press import pdf_pages, png
from product_pages import TYPES, infer, validate
from workflow import completed


class PrintTests(unittest.TestCase):
    def setUp(self):
        self.p = {
            "title": "Preschool Pencil Practice",
            "track": "Ebook",
            "step": "build-4",
            "op": "book",
            "subtype": "Educational workbook",
            "notes": "Trace paths, letters and numbers.",
            "outline": "Straight Lines in Three Directions\nCurves, Waves and Turns\nFour Familiar Shapes\nUppercase A-Z\nLowercase a-z\nNumbers 1-5",
        }
        self.track = {}

    def test_pencil_product(self):
        estimate, _ = quote_pages(self.p, self.track, {}, {})
        self.assertEqual(estimate, 0)
        saves = []
        run_pages(
            self.p,
            self.track,
            {},
            {},
            lambda: saves.append(len(self.track["book"]["pages"])),
        )
        book = self.track["book"]
        self.assertEqual(saves, list(range(1, 61)))
        self.assertTrue(quality(book)["ready"])
        self.assertEqual(len(PdfReader(BytesIO(pdf_pages(book))).pages), 61)
        self.assertTrue(png(pdf_pages(book, only=2)).startswith(b"\x89PNG"))
        page = book["pages"]["0"]
        with self.assertRaisesRegex(ValueError, "Restore the planned"):
            store_page(
                book,
                "0",
                {
                    "title": page["title"],
                    "blocks": [{"type": "writing_area", "value": 1}],
                },
            )
        self.assertEqual(page, book["pages"]["0"])
        del book["pages"]["2"]
        self.assertFalse(completed(self.track)[4])

    def test_higgsfield_page_illustration_keeps_cover_and_page_content(self):
        from PIL import Image
        from providers import quote_job, run_job

        quote_pages(self.p, self.track, {}, {})
        run_pages(self.p, self.track, {}, {}, lambda: None)
        book = self.track["book"]
        self.track["coverId"] = "original-cover"
        p = dict(
            track="Ebook",
            step="build-4",
            op="pageArt",
            pageIndex=1,
            edition=book["signature"],
            artDirection="Paper collage",
            id="once",
        )
        keys = {"Higgsfield": {"key": "fixture"}}
        cfg = {"model": "fixture"}
        with patch("providers.request", return_value={"usd": 0.02}) as request:
            price, _ = quote_job(p, self.track, cfg, keys)
            self.assertEqual(price, 0.02)
            self.assertIn(book["titles"][1], request.call_args.args[4]["prompt"])
        with patch("providers.request", return_value={"request_id": "page-job"}):
            run_job(p, self.track, cfg, keys, lambda: None)
        with self.assertRaisesRegex(ValueError, "existing illustration"):
            quote_job(p, self.track, cfg, keys)
        with patch(
            "providers.request", return_value={"status": "completed"}
        ) as request:
            run_job(dict(p, op="pageArtStatus"), self.track, cfg, keys, lambda: None)
            self.assertIn("/page-job/status", request.call_args.args[2])
        self.assertEqual(self.track["coverId"], "original-cover")
        image = BytesIO()
        Image.new("RGB", (180, 120), "salmon").save(image, "JPEG")
        plain = pdf_pages(book, only=2)
        illustrated = pdf_pages(book, only=2, illustrations={"1": image.getvalue()})
        doc = PdfReader(BytesIO(illustrated))
        self.assertEqual(len(doc.pages[0].images), 1)
        self.assertEqual(
            doc.pages[0].extract_text(),
            PdfReader(BytesIO(plain)).pages[0].extract_text(),
        )
        self.assertEqual(
            pdf_pages(book, only=3),
            pdf_pages(book, only=3, illustrations={"1": image.getvalue()}),
        )

    def test_invalid_schema_and_overflow(self):
        for k, v in [
            ("illustration", "missing.jpg"),
            ("letter_practice", ""),
            ("table", [["a"], ["x", "y"]]),
            ("heading", ""),
        ]:
            with self.assertRaises(ValueError):
                validate({"title": "Test", "blocks": [{"type": k, "value": v}]})
        p = {
            "title": "Test",
            "blocks": [{"type": "paragraph", "value": "Long content. " * 250}],
        }
        bk = {
            "slots": [{"title": "Test"}],
            "subtype": "Ebook",
            "pages": {},
            "units": {},
            "titles": ["Test"],
        }
        with self.assertRaisesRegex(ValueError, "print margins"):
            store_page(bk, "0", p)
        self.assertEqual({}, bk["pages"])

    def test_interrupted_text_generation_can_resume(self):
        self.p.update(title="A field guide", subtype="Ebook", outline="Observe\nRecord")

        def manuscript(n):
            return json.dumps(
                {
                    "title": n,
                    "blocks": [
                        {"type": "paragraph", "value": "A worked example for " + n}
                    ],
                }
            )

        with (
            tempfile.TemporaryDirectory() as folder,
            patch("page_builder.quote_job", return_value=(0.02, "review")),
        ):
            w = Workspace(Path(folder))
            t = w.db["tracks"]["Ebook"] = {"notes": {}, "results": {}}
            cost, _ = quote_pages(self.p, t, {}, {})
            self.assertEqual(0.08, cost)
            with patch(
                "page_builder.run_job", side_effect=[manuscript("Observe"), "broken"]
            ):
                with self.assertRaisesRegex(ValueError, "Page 2"):
                    run_pages(self.p, t, {}, {}, w.persist)
            w = Workspace(Path(folder))
            t = w.db["tracks"]["Ebook"]
            self.assertEqual(list(t["book"]["pages"]), ["0"])
            cost, _ = quote_pages(self.p, t, {}, {})
            self.assertEqual(0.06, cost)
            with patch(
                "page_builder.run_job",
                side_effect=[
                    manuscript("Observe in practice"),
                    manuscript("Record"),
                    manuscript("Record in practice"),
                ],
            ):
                run_pages(self.p, t, {}, {}, w.persist)
            doc = PdfReader(BytesIO(pdf_pages(t["book"])))
            self.assertEqual(len(doc.pages), 5)
            self.assertEqual(float(doc.pages[0].mediabox.width), 432)
            self.assertIn("example for Record", doc.pages[3].extract_text())
            self.assertTrue(quality(t["book"])["ready"])
            self.p["pageIndex"] = 0
            quote_pages(self.p, t, {}, {})
            self.assertEqual([j["index"] for j in self.p["pageJobs"]], ["0"])

    def test_subtypes_and_legacy_integrity(self):
        for k in TYPES:
            with self.subTest(kind=k):
                self.assertEqual(infer({"book": {"subtype": k}}), k)
        self.assertEqual(infer({"title": "Baking cookbook"}), "Cookbook")
        self.assertFalse(
            completed(
                {
                    "book": {
                        "titles": ["A", "B"],
                        "units": {"0": "Yes", "3": "Wrong index"},
                    }
                }
            )[4]
        )

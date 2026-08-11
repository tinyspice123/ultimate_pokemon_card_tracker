"""Unit tests for the network-facing maintenance scripts."""
import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[2] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import backup_supabase  # noqa: E402
import check_logos  # noqa: E402
import download_assets  # noqa: E402


class Response:
    def __init__(self, data):
        self.data = data

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.data


class BackupSupabaseTest(unittest.TestCase):
    def test_public_config_is_parsed(self):
        source = 'url: "https://project.supabase.co", publishableKey: "sb_publishable_test"'
        self.assertEqual(backup_supabase.parse_supabase_config(source),
                         ("https://project.supabase.co", "sb_publishable_test"))
        with self.assertRaisesRegex(ValueError, "missing"):
            backup_supabase.parse_supabase_config("const nope = true")

    def test_rows_export_in_existing_csv_format(self):
        text = backup_supabase.rows_to_csv([
            {"group_name": "Promos", "card_name": "Pikachu",
             "collector_number": "SVP 1", "variant": "Stamped",
             "source": "Box", "status": "Confirmed", "price": "£2",
             "quantity": 2, "image_url": "https://example.test/p.png"},
        ])
        self.assertIn("Group,Card,Number,Variant / Stamp", text)
        self.assertIn("Promos,,,,,,,,", text)
        self.assertIn(",Pikachu,SVP 1,Stamped,Box,Confirmed,£2,2,", text)

    def test_export_success_and_empty_set_failure(self):
        out = Path(tempfile.mkdtemp()) / "backups"
        payloads = {
            "good": [{"group_name": "Main", "card_name": "Eevee",
                      "collector_number": "1/1", "quantity": 1}],
            "empty": [],
        }
        def opener(request, timeout):
            set_id = "good" if "eq.good" in request.full_url else "empty"
            return Response(__import__("json").dumps(payloads[set_id]).encode())
        with contextlib.redirect_stdout(io.StringIO()):
            result = backup_supabase.backup(
                [{"id": "good"}, {"id": "empty"}], "https://db.test", "key",
                out, opener, sleeper=lambda _seconds: None)
        self.assertEqual(result, 1)
        self.assertTrue((out / "good.csv").exists())
        self.assertFalse((out / "empty.csv").exists())

    def test_temporary_failure_retries_with_backoff(self):
        attempts, delays = [], []
        def opener(*_args, **_kwargs):
            attempts.append(1)
            if len(attempts) < 3:
                raise TimeoutError("timed out")
            return Response(b"[]")
        data = backup_supabase.fetch_json(
            "https://db.test/rest", "key", opener, delays.append)
        self.assertEqual(data, [])
        self.assertEqual(delays, [2, 4])

    def test_empty_registry_is_success(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(backup_supabase.backup([], "url", "key"), 0)


class CheckLogosTest(unittest.TestCase):
    def test_candidates_cover_all_sources_and_invalid_series(self):
        entry = {"logo": "https://custom/logo.png", "tcgSet": "sv1",
                 "tcgdexSet": "ME2.5"}
        candidates = check_logos.candidates(entry)
        self.assertEqual(candidates[0], entry["logo"])
        self.assertIn("pokemontcg.io/sv1", candidates[1])
        self.assertIn("/me/ME2.5/", candidates[2])
        self.assertEqual(check_logos.candidates({"tcgdexSet": "123"}), [])

    def test_reachable_checks_size_and_handles_errors(self):
        self.assertTrue(check_logos.reachable(
            "https://example.test/logo", lambda *_args, **_kwargs: Response(b"x" * 100)))
        self.assertFalse(check_logos.reachable(
            "https://example.test/tiny", lambda *_args, **_kwargs: Response(b"x" * 99)))
        self.assertFalse(check_logos.reachable(
            "https://example.test/error", lambda *_args, **_kwargs: (_ for _ in ()).throw(OSError())))

    def test_check_success_fallback_broken_and_skipped(self):
        entries = [
            {"id": "skip"},
            {"id": "fallback", "logo": "bad", "tcgSet": "good"},
            {"id": "broken", "logo": "bad"},
        ]
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = check_logos.check(entries, lambda url: "good" in url)
        self.assertEqual(result, 1)
        self.assertIn("ok (https://images.pokemontcg.io/good/logo.png)", output.getvalue())
        self.assertIn("Broken: broken", output.getvalue())

        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(check_logos.check(entries[:2], lambda _url: True), 0)

    def test_main_empty_registry(self):
        with mock.patch.object(check_logos, "parse_sets", return_value=[]), \
                contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(check_logos.main(), 0)


class DownloadAssetsTest(unittest.TestCase):
    def test_candidates_and_fetch(self):
        entry = {"logo": "https://custom/logo.png", "tcgSet": "sv2",
                 "tcgdexSet": "xy1"}
        self.assertEqual(len(download_assets.candidates(entry)), 3)
        self.assertEqual(download_assets.candidates({"tcgdexSet": "7"}), [])
        data = download_assets.fetch(
            "https://example.test/logo", lambda *_args, **_kwargs: Response(b"logo"))
        self.assertEqual(data, b"logo")

    def test_empty_registry_fails(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(download_assets.download([]), 1)

    def test_download_fallback_small_success_and_missing(self):
        out = Path(tempfile.mkdtemp()) / "logos"
        calls = []

        def fetcher(url):
            calls.append(url)
            if "custom" in url:
                raise OSError("offline")
            if "tiny" in url:
                return b"x" * 99
            return b"x" * 2048

        entries = [
            {"id": "saved", "logo": "https://custom/logo", "tcgSet": "sv1"},
            {"id": "tiny", "logo": "https://tiny/logo"},
            {"id": "none"},
        ]
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = download_assets.download(entries, out, fetcher)
        self.assertEqual(result, 0)
        self.assertEqual((out / "saved.png").stat().st_size, 2048)
        self.assertFalse((out / "tiny.png").exists())
        self.assertIn("Missing: tiny, none", output.getvalue())
        self.assertEqual(len(calls), 3)

    def test_main_empty_registry(self):
        with mock.patch.object(download_assets, "parse_sets", return_value=[]), \
                contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(download_assets.main(), 1)


if __name__ == "__main__":
    unittest.main()

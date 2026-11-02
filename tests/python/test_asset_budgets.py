import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import check_asset_budgets


class AssetBudgetTests(unittest.TestCase):
    def test_small_unique_assets_pass(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "public").mkdir()
            (root / "public" / "one.png").write_bytes(b"one")
            self.assertEqual(check_asset_budgets.inspect(root), [])

    def test_oversized_public_directory_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "public").mkdir()
            (root / "public" / "app.js").write_bytes(b"1234")
            with mock.patch.object(check_asset_budgets, "MAX_PUBLIC_BYTES", 3):
                self.assertIn("public/ is", check_asset_budgets.inspect(root)[0])

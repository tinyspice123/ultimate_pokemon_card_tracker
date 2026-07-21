import csv
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from validate_data import validate_manifest, validate_sheet  # noqa: E402


class SheetValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def write_sheet(self, rows):
        path = self.root / "cards.csv"
        with path.open("w", newline="", encoding="utf-8") as handle:
            csv.writer(handle).writerows(rows)
        return path

    def test_valid_sheet_returns_normalized_card_keys(self):
        path = self.write_sheet([
            ["Group", "Card", "Number", "Variant / Stamp", "Have"],
            ["Base", "", "", "", ""],
            ["", "Pikachu", "025/102", "Unlimited", "2"],
        ])
        errors, keys = validate_sheet(path)
        self.assertEqual(errors, [])
        self.assertEqual(keys, {"pikachu|025/102|unlimited"})

    def test_duplicate_missing_number_and_bad_quantity_are_reported(self):
        path = self.write_sheet([
            ["Card", "Number", "Variant", "Have"],
            ["Pikachu", "", "Unlimited", "sometimes"],
            ["Pikachu", "", "Unlimited", ""],
        ])
        errors, _ = validate_sheet(path)
        joined = "\n".join(errors)
        self.assertIn("no collector number", joined)
        self.assertIn("invalid Have value", joined)
        self.assertIn("duplicate card/number/variant", joined)


class ManifestValidationTests(unittest.TestCase):
    def test_missing_unmapped_and_orphan_images_are_reported(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "orphan.jpg").write_bytes(b"jpg")
            manifest = root / "manifest.txt"
            manifest.write_text(
                "Pikachu|025/102|Stamped|missing.jpg\n", encoding="utf-8")
            errors = "\n".join(validate_manifest(manifest, {"other|001|normal"}))
            self.assertIn("missing image file", errors)
            self.assertIn("not present in the sheet", errors)
            self.assertIn("not referenced by manifest.txt", errors)


if __name__ == "__main__":
    unittest.main()

import tempfile
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from import_supabase_cards import quantity, rows_for_set


class SupabaseImportTests(unittest.TestCase):
    def test_quantity_matches_tracker_markers(self):
        self.assertEqual(quantity("3"), 3)
        self.assertEqual(quantity("x"), 1)
        self.assertEqual(quantity("no"), 0)

    def test_rows_are_stable_and_follow_section_groups(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "demo.csv"
            path.write_text(
                "Group,Card,Number,Variant / Stamp,Have,Image URL\n"
                "Fury,,,,,\n"
                ",Pikachu,001/100,Regular,2,https://example.com/card.webp\n",
                encoding="utf-8",
            )
            first = rows_for_set("demo", path)
            second = rows_for_set("demo", path)
        self.assertEqual(first, second)
        self.assertEqual(first[0]["group_name"], "Fury")
        self.assertEqual(first[0]["quantity"], 2)
        self.assertEqual(len(first[0]["id"]), 32)


if __name__ == "__main__":
    unittest.main()

import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.recovery_drill import drill, quantity, restore


class RecoveryDrillTests(unittest.TestCase):
    def test_quantity_markers(self):
        self.assertEqual(quantity("x"), 1)
        self.assertEqual(quantity("3"), 3)
        self.assertEqual(quantity("FALSE"), 0)
        with self.assertRaises(ValueError):
            quantity("-2")

    def test_round_trip(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            backups = Path(temp_dir)
            with (backups / "sample.csv").open("w", encoding="utf-8", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(["Card", "Number", "Variant / Stamp", "Have"])
                writer.writerow(["Pikachu", "1/2", "Standard", "2"])
                writer.writerow(["Eevee", "2/2", "Reverse Holo", "x"])
            self.assertEqual(drill(backups), (2, 3))

    def test_duplicate_identity_fails_restore(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            backups = Path(temp_dir)
            (backups / "sample.csv").write_text(
                "Card,Number,Variant,Have\nPikachu,1,Standard,1\nPikachu,1,Standard,2\n",
                encoding="utf-8",
            )
            with sqlite3.connect(":memory:") as connection:
                with self.assertRaisesRegex(ValueError, "duplicate"):
                    restore(backups, connection)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Round-trip backup CSVs through an isolated SQLite recovery database."""

from __future__ import annotations

import csv
import sqlite3
import sys
import tempfile
from pathlib import Path


REQUIRED = {"Card", "Have"}


def quantity(value: str) -> int:
    text = (value or "").strip().lower()
    if text in {"", "0", "false", "no", "n", "-", "–"}:
        return 0
    if text in {"true", "yes", "y", "x"}:
        return 1
    parsed = int(text)
    if parsed < 0:
        raise ValueError("quantity cannot be negative")
    return parsed


def restore(backups: Path, connection: sqlite3.Connection) -> tuple[int, int]:
    connection.execute("""
        create table restored_cards (
          set_id text not null,
          card_name text not null,
          collector_number text not null,
          variant text not null,
          quantity integer not null check (quantity >= 0),
          primary key (set_id, card_name, collector_number, variant)
        )
    """)
    expected_rows = expected_quantity = 0
    for csv_path in sorted(backups.glob("*.csv")):
        with csv_path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            missing = REQUIRED - set(reader.fieldnames or ())
            if missing:
                raise ValueError(f"{csv_path}: missing columns {sorted(missing)}")
            for row_number, row in enumerate(reader, 2):
                card = (row.get("Card") or "").strip()
                if not card:
                    continue
                qty = quantity(row.get("Have") or "")
                try:
                    connection.execute(
                        "insert into restored_cards values (?, ?, ?, ?, ?)",
                        (csv_path.stem, card, (row.get("Number") or "").strip(),
                         (row.get("Variant / Stamp") or row.get("Variant") or "").strip(), qty),
                    )
                except sqlite3.IntegrityError as error:
                    raise ValueError(f"{csv_path}:{row_number}: duplicate or invalid card") from error
                expected_rows += 1
                expected_quantity += qty
    connection.commit()
    return expected_rows, expected_quantity


def drill(backups: Path) -> tuple[int, int]:
    with tempfile.TemporaryDirectory(prefix="card-recovery-") as temp_dir:
        database = Path(temp_dir) / "recovery.sqlite3"
        with sqlite3.connect(database) as connection:
            expected = restore(backups, connection)
            actual = connection.execute(
                "select count(*), coalesce(sum(quantity), 0) from restored_cards"
            ).fetchone()
            integrity = connection.execute("pragma integrity_check").fetchone()[0]
            if actual != expected or integrity != "ok":
                raise RuntimeError(f"recovery mismatch: expected={expected}, actual={actual}, integrity={integrity}")
            return actual


if __name__ == "__main__":
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "backups")
    rows, copies = drill(root)
    if rows == 0:
        raise SystemExit("No cards were restored")
    print(f"Recovery drill passed: restored {rows} cards and {copies} owned copies.")

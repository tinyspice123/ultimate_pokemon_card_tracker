#!/usr/bin/env python3
"""Keep the static deployment and accidental duplicate assets bounded."""
from __future__ import annotations

import hashlib
import gzip
import sys
from collections import defaultdict
from pathlib import Path

MAX_PUBLIC_BYTES = 150 * 1024 * 1024
MAX_ASSET_BYTES = 2100 * 1024
MAX_DUPLICATE_BYTES = 38 * 1024 * 1024
MAX_SHELL_GZIP_BYTES = 160 * 1024
ASSET_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".woff2"}


def inspect(root: Path) -> list[str]:
    public = root / "public"
    files = [path for path in public.rglob("*") if path.is_file()]
    errors: list[str] = []
    total = sum(path.stat().st_size for path in files)
    if total > MAX_PUBLIC_BYTES:
        errors.append(f"public/ is {total / 1024 / 1024:.2f} MiB; budget is {MAX_PUBLIC_BYTES / 1024 / 1024:.0f} MiB")
    shell_files = [path for path in files if path.suffix.casefold() in {".html", ".css", ".js", ".json"}]
    shell_gzip = sum(len(gzip.compress(path.read_bytes(), mtime=0)) for path in shell_files)
    if shell_gzip > MAX_SHELL_GZIP_BYTES:
        errors.append(f"compressed app shell is {shell_gzip / 1024:.1f} KiB; budget is {MAX_SHELL_GZIP_BYTES / 1024:.0f} KiB")
    hashes: dict[str, list[Path]] = defaultdict(list)
    for path in files:
        size = path.stat().st_size
        if path.suffix.casefold() not in ASSET_SUFFIXES:
            continue
        if size > MAX_ASSET_BYTES:
            errors.append(f"{path}: {size / 1024 / 1024:.2f} MiB exceeds the 2.05 MiB per-asset budget")
        hashes[hashlib.sha256(path.read_bytes()).hexdigest()].append(path)
    duplicate_bytes = sum(sum(path.stat().st_size for path in paths[1:])
                          for paths in hashes.values() if len(paths) > 1)
    if duplicate_bytes > MAX_DUPLICATE_BYTES:
        errors.append(f"exact duplicate assets waste {duplicate_bytes / 1024 / 1024:.2f} MiB; budget is {MAX_DUPLICATE_BYTES / 1024 / 1024:.0f} MiB")
    print(f"Asset budgets: public={total / 1024 / 1024:.2f} MiB, shell gzip={shell_gzip / 1024:.1f} KiB, duplicate waste={duplicate_bytes / 1024 / 1024:.2f} MiB")
    return errors


if __name__ == "__main__":
    failures = inspect(Path(__file__).resolve().parents[1])
    for failure in failures:
        print(f"ERROR: {failure}", file=sys.stderr)
    raise SystemExit(bool(failures))

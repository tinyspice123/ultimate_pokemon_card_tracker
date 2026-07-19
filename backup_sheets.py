#!/usr/bin/env python3
"""
Collection history backup — fetches every active set's published CSV and
writes it to backups/<set-id>.csv. Run by .github/workflows/backup.yml on
a weekly schedule; git history provides the versioning, so each week's
changes are a normal git diff.

Run manually any time:  python3 backup_sheets.py
"""
import re, sys, urllib.request
from pathlib import Path

src = Path("sets.js").read_text(encoding="utf-8")
active = re.sub(r"^\s*//.*$", "", src, flags=re.M)

sets = []
for m in re.finditer(r'"([\w.\-]+)"\s*:\s*\{(.*?)\n\s*\}', active, re.S):
    sid, body = m.group(1), m.group(2)
    sm = re.search(r'sheet\s*:\s*"([^"]+)"', body)
    if sm:
        sets.append((sid, sm.group(1)))

if not sets:
    print("No sets with sheet links found in sets.js")
    sys.exit(0)

out = Path("backups"); out.mkdir(exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (card-tracker-backup)"}
saved, failed = 0, []

for sid, url in sets:
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read().decode("utf-8")
        if data.lstrip().startswith("<"):
            raise ValueError("got a web page, not CSV (tab not published?)")
        (out / f"{sid}.csv").write_text(data, encoding="utf-8")
        rows = data.count("\n")
        print(f"  {sid}: {rows} rows")
        saved += 1
    except Exception as e:
        print(f"  {sid}: FAILED - {e}")
        failed.append(sid)

print(f"\n{saved}/{len(sets)} sets backed up to backups/")
if failed:
    print("Failed:", ", ".join(failed))
    sys.exit(1)   # fail the workflow so you notice a broken sheet link

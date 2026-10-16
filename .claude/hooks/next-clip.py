#!/usr/bin/env python3
"""Print the clip queue for the session reminder: the open slots from the
slot tables in clips-log.md, joined with clip-plan.md, in order."""
import re
from datetime import date

YEAR = 2026
MONTHS = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}


def table_rows(text, header_start, every=False):
    """Rows of the table(s) whose header line starts with header_start."""
    rows, inside = [], False
    for line in text.splitlines():
        if line.startswith(header_start):
            inside = True
            continue
        if inside:
            if not line.startswith("|"):
                inside = False
                if rows and not every:
                    break
                continue
            cells = [c.strip() for c in line.strip("|").split("|")]
            if set(cells[0]) <= set("-: "):
                continue
            rows.append(cells)
    return rows


log = open("clips-log.md", encoding="utf-8").read()
plan = open("clip-plan.md", encoding="utf-8").read() if __import__("os").path.exists("clip-plan.md") else ""
moments = {r[1]: r for r in table_rows(plan, "| # |", every=True)}
slots = table_rows(log, "| Day | Clip | Status |", every=True) + table_rows(log, "| Slot | Clip | Status |", every=True)
today = date.today()

queue = []
for day, clip, status in slots:
    if status != "open":
        continue
    mon, dd, *at = day.split()
    when = date(YEAR, MONTHS[mon], int(dd))
    at = " ".join(at) or "9 AM"
    hh, ampm = at.split()
    minutes = (int(hh) % 12 + (12 if ampm == "PM" else 0)) * 60
    m = moments.get(clip)
    if m and len(m) >= 12:
        part = f"Part {m[2]}: " if m[2] not in ("—", "") else ""
        detail = f"{part}{m[7]} [cut {m[3]} to {m[4]}, cold open {m[5]}]"
    elif m:
        detail = f'{m[4]} [cut {m[2]} to {m[3]}]' if len(m) >= 9 else f'{m[2]} (search: {m[3]})'
    else:
        detail = "see clip-plan.md"
    tag = " [SLOT PASSED: mark missed, give this clip the next open slot]" if when < today else ""
    queue.append(((when, minutes), f"{mon} {dd} {at} CT: {clip}: {detail}{tag}"))

queue = [q for _, q in sorted(queue, key=lambda x: x[0])]

if not queue:
    print("Clip queue: every planned slot is filled. Suggest step 1 with a new episode.")
else:
    print("CLIP QUEUE (work ONE clip at a time, strictly in this order; do not skip ahead):")
    print(f"  NEXT UP -> {queue[0]}")
    for q in queue[1:]:
        print(f"  then     -> {q}")
    print("Whenever you ask the user to cut or upload a clip, ALWAYS show it as a table: | Slot | Clip | Part | Cut from | To | Cold open (put first) | Moment | Key line | (from clip-plan.md), with the episode link above it. "
          "Tell the user exactly which clip to cut next and which moment it is. When it lands in the inbox, run step 4 for that clip only, "
          "then remind them of the next clip in the list. If a later clip arrives before an earlier one, schedule it in its own slot but "
          "remind them the earlier clip is still missing.")

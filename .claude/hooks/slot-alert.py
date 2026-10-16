#!/usr/bin/env python3
"""Daily 6 PM check (launchd): if tomorrow has an open slot, or nothing
scheduled at all, email the user through the Mac Mail app.

Reads the "## <Creator> <episode> slots" tables in clips-log.md and the cut
sheet in clip-plan.md. Usage: slot-alert.py [--dry-run]
"""
import os
import re
import subprocess
import sys
from datetime import date, timedelta

TO = os.environ.get("SLOT_ALERT_EMAIL", "you@example.com")
# launchd can't read ~/Desktop, so sync-alert-data.sh copies this script and
# clips-log.md / clip-plan.md into ~/Library/Application Support/ClipManager/.
ROOT = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(ROOT, "slot-alert.state")
MONTHS = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}


def read(name):
    try:
        with open(os.path.join(ROOT, name), encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def slot_rows(log):
    """Yield (creator, day, clip, status, time) from every slot table."""
    creator = None
    for line in log.splitlines():
        heading = re.match(r"^## (.+?) slots\b", line)
        if heading:
            creator = re.sub(r"\s+(EP|Ep|ep|#)\.?\s*\d+.*$", "", heading.group(1))
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        slot = re.match(r"^([A-Z][a-z]{2}) (\d{1,2})(?: (\d{1,2}(?::\d{2})? [AP]M))?$", cells[0]) if len(cells) == 3 else None
        if creator and line.startswith("|") and slot:
            mon, dd, at = slot.groups()
            yield creator, date(date.today().year, MONTHS[mon], int(dd)), cells[1], cells[2], at or "9 AM"


def moment(plan, clip):
    for line in plan.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 12 and cells[1] == clip:
            part = f"Part {cells[2]}: " if cells[2] not in ("—", "") else ""
            return f"{part}{cells[7]} (cut {cells[3]} to {cells[4]}, cold open {cells[5]})"
        if len(cells) >= 9 and cells[1] == clip:
            return f"{cells[4]} (cut {cells[2]} to {cells[3]} in the episode)"
        if len(cells) >= 4 and cells[1] == clip:
            return f"{cells[2]} (search for: {cells[3]})"
    return "see clip-plan.md"


def build_message(tomorrow):
    rows = list(slot_rows(read("clips-log.md")))
    plan = read("clip-plan.md")
    day = tomorrow.strftime("%A, %b %-d")
    open_rows = [r for r in rows if r[1] == tomorrow and r[3] == "open"]
    scheduled = [r for r in rows if r[1] == tomorrow and r[3] == "scheduled"]
    if open_rows:
        lines = [f"{len(open_rows)} of tomorrow's slots are still empty ({day}, CT).", ""]
        for creator, _, clip, _, at in open_rows:
            lines += [f"{at}: {creator}", f"  Clip to cut: {clip}", f"  Moment: {moment(plan, clip)}", ""]
        subject = f"Empty slot tomorrow: check {open_rows[0][0]}"
    elif not scheduled:
        last = rows[-1][0] if rows else "your current streamer"
        lines = [f"Nothing is scheduled for tomorrow ({day}).", "",
                 f"Check {last} or the streamer you're submitting next.", "Open the project, name the streamer, and run /post with their stream link.", ""]
        subject = f"Nothing scheduled tomorrow: check {last}"
    else:
        return None
    lines += ["Then: cut it in CapCut (61 to 90s) with the cold open line at the front, drop it in the Clip Inbox, and approve it in Claude.", "Empty slots post nothing."]
    return subject, "\n".join(lines)


def send(subject, body):
    script = '''on run argv
  tell application "Mail"
    set m to make new outgoing message with properties {subject:item 1 of argv, content:item 2 of argv, visible:false}
    tell m to make new to recipient at end of to recipients with properties {address:item 3 of argv}
    send m
  end tell
end run'''
    subprocess.run(["osascript", "-e", script, subject, body, TO], check=True, capture_output=True, text=True)


def main():
    tomorrow = date.today() + timedelta(days=1)
    message = build_message(tomorrow)
    if "--dry-run" in sys.argv:
        print(message or "No alert: tomorrow's slots are filled.")
        return
    if not message:
        return
    try:
        with open(STATE) as f:
            if f.read().strip() == tomorrow.isoformat():
                return  # already alerted for tomorrow
    except OSError:
        pass
    send(*message)
    with open(STATE, "w") as f:
        f.write(tomorrow.isoformat())
    print(f"{date.today()}: emailed {TO}: {message[0]}")


if __name__ == "__main__":
    main()

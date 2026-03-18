@'
import json
import os
import pathlib
import urllib.request

if not os.environ.get("SLACK_WEBHOOK_URL"):
    print("SLACK_WEBHOOK_URL is empty. Skip Slack notification.")
    raise SystemExit(0)

text = pathlib.Path("review_summary_ja.txt").read_text(encoding="utf-8").strip()
payload = json.dumps({"text": text}).encode("utf-8")

req = urllib.request.Request(
    os.environ["SLACK_WEBHOOK_URL"],
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST",
)

with urllib.request.urlopen(req) as res:
    print(res.read().decode("utf-8"))
'@ | python -

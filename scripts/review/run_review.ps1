@'
import json
import os
import pathlib
import urllib.request

diff_text = pathlib.Path(os.environ["DIFF_PATH"]).read_text(encoding="utf-8")
api_key = os.environ["OPENAI_API_KEY"]

payload = {
    "model": "gpt-4o-mini",
    "messages": [
        {
            "role": "system",
            "content": "You are a code reviewer. Review the provided git diff and return concise findings."
        },
        {
            "role": "user",
            "content": diff_text
        }
    ]
}

req = urllib.request.Request(
    "https://api.openai.com/v1/chat/completions",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    },
    method="POST",
)

with urllib.request.urlopen(req) as res:
    body = res.read().decode("utf-8")
    pathlib.Path("review_result.json").write_text(body, encoding="utf-8")
    print(body)
'@ | python -

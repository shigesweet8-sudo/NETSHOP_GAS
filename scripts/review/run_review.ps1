@'
import json
import os
import pathlib
import urllib.request

diff_text = pathlib.Path(os.environ["DIFF_PATH"]).read_text(encoding="utf-8")
api_key = os.environ["OPENAI_API_KEY"]

payload = {
    "model": "gpt-5.4",
    "messages": [
        {
            "role": "system",
            "content": """You are a strict code reviewer inside ALTANA AI FACTORY.
Review the provided git diff against the intended implementation.
Return concise findings only.

Review focus:
- Whether the changed files match the Issue objective
- Whether there is real code implementation in the diff
- Whether only md/json or other meta/document files changed without implementation
- Whether unrelated files were changed
- Whether the diff appears to violate the requested scope
- Whether there are dangerous changes

Flag critical issues when:
- there is no real code diff
- only meta/document files changed without implementation
- unrelated files were changed
- the diff appears to violate the requested scope

Severity guidance:
- Use CRITICAL or HIGH only when the risk is clearly dangerous
- Even when the diff looks SAFE, always detect and report when there is no real code diff
- Be precise and do not overstate risk"""
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

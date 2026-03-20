import json
import os
import pathlib
import re
import urllib.request


SYSTEM_PROMPT = """You are an AI architect inside ALTANA FACTORY.
Your job is to convert a GitHub Issue into a Codex-ready implementation brief.

Return plain text using exactly this structure.

For a simple issue:
MODE: DIRECT

CODEX_INSTRUCTION:
<markdown instruction for Codex>

For a larger issue that should be split into execution units:
MODE: PLAN

TASKS:
1. <smallest meaningful implementation unit>
2. <next implementation unit>
3. <next implementation unit>

CODEX_INSTRUCTION:
<markdown instruction for Codex>

Rules for TASKS:
- Split only when the issue is too large for one safe implementation pass.
- Keep tasks implementation-oriented and ordered.
- Each task must be concrete, testable, and small enough for a single Codex run.
- Do not create unnecessary tasks.

Rules for CODEX_INSTRUCTION:
- Write in Japanese.
- Optimize for Codex execution quality, not for human prose style.
- Start with a short objective.
- Include clear scope, constraints, target files, non-goals, and completion criteria.
- If target files are not explicitly known, say \"TARGET FILES: 要確認\".
- If information is missing, say what must be confirmed instead of guessing.
- Do not introduce features not requested in the issue.
- Do not expand the scope beyond the issue.
- Make the instruction immediately executable by Codex.

Recommended CODEX_INSTRUCTION format:
## Objective
## Scope
## Target Files
## Constraints
## Non-Goals
## Implementation Steps
## Completion Criteria
## Validation

Only generate content grounded in the issue."""


def build_user_prompt(issue_title: str, issue_body: str) -> str:
    return f"""GitHub Issue Title:
{issue_title or '(no title)'}

GitHub Issue Body:
{issue_body}
"""


def main() -> None:
    issue_body = pathlib.Path("issue_body.md").read_text(encoding="utf-8").strip()
    issue_title = os.environ.get("ISSUE_TITLE", "").strip()
    api_key = os.environ["OPENAI_API_KEY"]

    payload = {
        "model": "gpt-5.4",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(issue_title, issue_body)},
        ],
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
        pathlib.Path("openai_response.json").write_text(body, encoding="utf-8")
        print(body)

    data = json.loads(body)
    content = data["choices"][0]["message"]["content"].strip()

    mode_match = re.search(r"(?m)^MODE:\s*(DIRECT|PLAN)\s*$", content)
    mode = mode_match.group(1) if mode_match else "DIRECT"

    tasks_match = re.search(r"(?s)TASKS:\s*(.*?)\n\s*CODEX_INSTRUCTION:", content)
    if mode == "PLAN" and tasks_match:
        pathlib.Path("issue_tasks.md").write_text(tasks_match.group(1).strip() + "\n", encoding="utf-8")

    instruction_match = re.search(r"(?s)CODEX_INSTRUCTION:\s*(.*)$", content)
    instruction = instruction_match.group(1).strip() if instruction_match else content

    pathlib.Path("codex_instruction.md").write_text(instruction + "\n", encoding="utf-8")
    print(content)


if __name__ == "__main__":
    main()

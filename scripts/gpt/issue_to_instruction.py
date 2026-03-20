import json
import os
import pathlib
import re
import urllib.request


SYSTEM_PROMPT = """You are an AI architect inside ALTANA FACTORY.
Your job is to convert a GitHub Issue into a Codex-ready implementation markdown.

Return plain text using exactly this structure.

For a simple implementation issue:
MODE: DIRECT

CODEX_INSTRUCTION:
<markdown instruction for Codex>

For a larger implementation issue that should be split into execution units:
MODE: PLAN

TASKS:
1. <smallest meaningful implementation unit>
2. <next implementation unit>
3. <next implementation unit>

CODEX_INSTRUCTION:
<markdown instruction for Codex>

Absolute rules:
- Write TASKS and CODEX_INSTRUCTION in Japanese.
- This is for implementation, not for investigation notes.
- Do not end with documentation-only work.
- Do not produce a plan that only edits md/json/txt files unless the issue explicitly requests that.
- If the issue is an implementation request, CODEX_INSTRUCTION must direct Codex to change real implementation files.
- If target files are not explicitly known, infer the most likely implementation files from the issue and write them as candidates.
- Keep 1 Issue = 1 feature.
- Do not add unrelated scope.
- If information is missing, list the uncertainty briefly under Constraints, but still produce the most executable instruction possible.

Rules for TASKS:
- Split only when one Codex run would be too large or risky.
- Keep tasks implementation-oriented and ordered.
- Each task must be concrete, testable, and small enough for a single Codex run.
- Do not create unnecessary tasks.

Rules for CODEX_INSTRUCTION:
- Optimize for Codex execution quality, not for human prose.
- Start with a short objective.
- Include implementation scope, target files, constraints, non-goals, concrete steps, and completion criteria.
- Explicitly require real code changes in implementation files.
- Explicitly forbid ending with only codex_instruction.md / issue_tasks.md / openai_response.json changes.
- Make the instruction immediately executable by Codex.

Required CODEX_INSTRUCTION format:
## 目的
## 実装スコープ
## 対象ファイル
## 制約
## 非対象
## 実装ステップ
## 完了条件
## 検証

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

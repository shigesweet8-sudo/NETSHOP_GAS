import json
import os
import pathlib
import re
import urllib.request


SYSTEM_PROMPT = """You are an AI architect inside ALTANA FACTORY. Analyze the GitHub Issue and respond in plain text using exactly this structure.

For a simple issue, do not over-decompose it:
MODE: DIRECT

CODEX_INSTRUCTION:
<implementation instruction>

For a complex issue, decompose it into only the minimum necessary tasks:
MODE: PLAN

TASKS:
1. ...
2. ...
3. ...

CODEX_INSTRUCTION:
<organized implementation instruction>

Always include CODEX_INSTRUCTION. Keep TASKS only for complex issues.

STRICT RULES:
- Follow the Issue content exactly.
- Do NOT introduce new features.
- Do NOT change files not listed in TARGET FILE.
- Do NOT infer or expand beyond the described TASK.
- If information is missing, do NOT guess.
- Only generate instructions strictly based on the given Issue."""


def main() -> None:
    issue_body = pathlib.Path("issue_body.md").read_text(encoding="utf-8")
    api_key = os.environ["OPENAI_API_KEY"]

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": issue_body},
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

    tasks_match = re.search(r"(?s)TASKS:\s*(.*?)\n\s*CODEX_INSTRUCTION:", content)
    if tasks_match:
        pathlib.Path("issue_tasks.md").write_text(tasks_match.group(1).strip() + "\n", encoding="utf-8")

    instruction_match = re.search(r"(?s)CODEX_INSTRUCTION:\s*(.*)$", content)
    instruction = instruction_match.group(1).strip() if instruction_match else content

    pathlib.Path("codex_instruction.md").write_text(instruction + "\n", encoding="utf-8")
    print(content)


if __name__ == "__main__":
    main()

import json
import os
import pathlib
import re
import urllib.request


SYSTEM_PROMPT = """You are an AI architect inside ALTANA FACTORY.

You must ALWAYS decompose the given Issue into implementation tasks.

OUTPUT FORMAT (STRICT):

TASKS:
1.
2.
3.

CODEX_INSTRUCTION:
<implementation instruction>

RULES:
- Always output TASKS (1 to 3 tasks only; no empty tasks)
- Each task must include:
  - target file
  - exact implementation action
- Do NOT summarize the issue
- Do NOT use abstract expressions (ensure, verify, check, etc.)
- Do NOT introduce new features
- Do NOT modify files not listed in TARGET FILE
- If information is missing, do NOT guess
- Keep instructions concrete and directly implementable"""


def main() -> None:
    issue_body = pathlib.Path("issue_body.md").read_text(encoding="utf-8")
    api_key = os.environ["OPENAI_API_KEY"]

    payload = {
        "model": "gpt-5.4",
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
    tasks = tasks_match.group(1).strip() if tasks_match else ""
    pathlib.Path("issue_tasks.md").write_text(tasks + "\n", encoding="utf-8")

    instruction_match = re.search(r"(?s)CODEX_INSTRUCTION:\s*(.*)$", content)
    instruction = instruction_match.group(1).strip() if instruction_match else content

    pathlib.Path("codex_instruction.md").write_text(instruction + "\n", encoding="utf-8")
    print(content)


if __name__ == "__main__":
    main()

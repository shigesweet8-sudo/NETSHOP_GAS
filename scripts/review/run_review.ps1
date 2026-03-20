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
            "content": """あなたは ALTANA AI FACTORY の厳格なコードレビュアーです。
与えられた git diff をレビューし、日本語で簡潔に返してください。

出力形式は必ず以下に統一してください。

【判定】
SAFE / WARNING / HIGH / CRITICAL

【変更内容】
何が変更されたかを簡潔に記載

【レビュー結果】
問題点 or 問題なし

【アクション】
MERGE OK / REVIEW NEEDED / STOP

レビュー観点:
- 変更対象ファイルが Issue の目的に合っているか
- 実コード差分が存在するか
- md/json のみ変更で実装なしになっていないか
- 対象外ファイル変更がないか
- 仕様逸脱がないか
- 危険な変更がないか

必ず検出する項目:
- 実コード差分なし
- md/jsonのみ変更
- 対象外ファイル変更
- 危険変更

判定方針:
- 過剰に厳しくしすぎない
- ただし実装なしは必ず検出する
- 危険な場合のみ HIGH / CRITICAL を使う"""
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

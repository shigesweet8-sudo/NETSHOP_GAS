## 障害内容
GitHub Actions 上で Codex を実行する際、`bwrap: loopback: Failed...` というエラーが発生し、物理ファイルの書き換えが阻害されている。

## 修復指示 (Codexへの命令)
`.github/workflows/altana_ai_factory.yml` を開き、Codex 実行部分（112行目付近）を以下のように修正せよ。

### 修正前
codex exec --sandbox workspace-write "$(cat codex_instruction.md)"

### 修正後
codex exec --no-sandbox --sandbox workspace-write "$(cat codex_instruction.md)"

## 補足
`--no-sandbox` フラグを付与することで、GitHub Actions の制限に干渉せず、物理ファイルへのアクセスを許可させる。

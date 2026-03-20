# ALTANA AI FACTORY ISSUE

## MODE
DIRECT

## GOAL
Slackに送るレビュー要約が英語固定文になる問題を修正し、run_review.ps1 が返した日本語レビュー本文をベースに通知する

## CHANGE TYPE
修正

## PROJECT
NETSHOP_GAS

## MODULE
WORKFLOW

## TARGET FILE
.github/workflows/altana_ai_factory.yml

## CONTEXT
scripts/review/run_review.ps1 は日本語レビュー化済みだが、
workflow内の "Create Japanese review summary" ステップが
review_result.json の内容を使わず、英語固定テンプレで review_summary_ja.txt を再生成している

そのため Slack通知が以下のような英語固定文になる
- ALTANA AI FACTORY REVIEW
- Issue
- Changed Files
- Risk
- Action

今回の修正では、review_result.json のレビュー本文を日本語のまま活かすこと

## TASKS
1. .github/workflows/altana_ai_factory.yml の "Create Japanese review summary" ステップのみ修正する
2. review_result.json の content をベースに review_summary_ja.txt を生成する
3. 可能なら以下の補助情報だけを日本語で追加してよい
   - Issue
   - Changed Files
4. 英語固定テンプレ
   - ALTANA AI FACTORY REVIEW
   - Risk
   - Action
   のような固定出力は廃止する
5. Check review severity の既存ロジックは壊さない

## CONSTRAINTS
- 変更対象は .github/workflows/altana_ai_factory.yml のみ
- 他ファイル変更禁止
- 最小差分
- run_review.ps1 は変更しない
- 既存の review severity 判定は維持
- diff --git 形式で出力

## DONE CONDITION
- Slack通知文の元になる review_summary_ja.txt が日本語レビュー本文ベースになる
- 英語固定テンプレが消える
- review severity 判定は従来どおり動作する
- PRに yml の実コード差分が含まれる

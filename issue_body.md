# ALTANA AI FACTORY ISSUE

## MODE
DIRECT

## GOAL
レビュー日本語化が反映されているかを確認するため、実コード差分が確実に出る軽微修正を1件行う

## CHANGE TYPE
修正

## PROJECT
NETSHOP_GAS

## MODULE
API

## TARGET FILE
20_api_netshop.gs

## TASKS
1. api_listItems 関数内に Logger.log を1行追加する
2. 既存ロジックは一切変更しない
3. 実コード差分のみを発生させる（md/json変更禁止）

## CONSTRAINTS
- 他ファイルは変更しない
- ロジック変更禁止
- 削除禁止
- 追加は Logger.log のみ
- 最小差分

## DONE CONDITION
- 20_api_netshop.gs に1行のログ追加が入る
- PRに実コード差分が含まれる
- Review結果が日本語で返る
- 判定 / 変更内容 / レビュー結果 / アクション の形式で出る

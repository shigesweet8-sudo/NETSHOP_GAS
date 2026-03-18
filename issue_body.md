# WAVE Web化 STEP1

## MODE
DIRECT

## GOAL
api_listItems のデータを
HTMLで一覧表示できる状態にする

## PROJECT
NETSHOP_GAS

## TARGET
HTML一覧画面

## RULE
- HTMLはシートを直接触らない
- 必ず GAS API 経由
- 最小差分
- 既存APIは変更しない
- デバッグUIは禁止

## TASK
1. google.script.run で api_listItems を呼ぶ

2. 取得データをコンソール出力する
   （表示ではなく確認）

3. render関数を作る
   - 配列を受け取る
   - ループ処理

4. 1行ずつHTMLに表示する
   - まずはJSON文字列でもOK

## DONE CONDITION
- api_listItems の返却が取得できる
- HTMLに1件以上表示される

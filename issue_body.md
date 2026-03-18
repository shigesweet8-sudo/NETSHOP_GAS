# WAVE Web化 STEP2

## MODE
DIRECT

## GOAL
商品登録API api_createItem を作成し
データを追加できるようにする

## PROJECT
NETSHOP_GAS

## TARGET
20_api_netshop.gs

## RULE
- CONFIG.COLS を使用
- HTMLは触らない
- append処理のみ
- 最小差分
- 既存ロジック破壊禁止

## TASK
1. api_createItem(payload) を作成
2. appendRow で1行追加
3. ID生成（簡易でOK）
4. 初期ステータス設定

## DONE CONDITION
- データが1件追加される

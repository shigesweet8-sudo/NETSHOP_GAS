# ALTANA AI FACTORY ISSUE
# ALTANA AI FACTORY ISSUE（実装専用）

---

## MODE
DIRECT

---

## GOAL
WAVE画面から商品登録を行い、api_createItemでデータ追加できるようにする

---

## CHANGE TYPE
修正

---

## PROJECT
NETSHOP_GAS

---

## MODULE
WEB UI

---

## TARGET FILE
index.html

---

## CHANGE DETAIL（実装内容）

1. 商品登録フォームを追加
- 商品名 input
- 仕入金額 input
- 販売金額 input
- 数量 input

2. 登録ボタンを追加

3. 登録ボタンクリック時に api_createItem を呼び出す

4. 登録成功時に api_listItems を再実行し、一覧を再描画する

---

## CONSTRAINT（制約）

- API変更禁止
- index.html 以外の変更禁止
- テスト用コード追加禁止
- debugコード追加禁止
- 確認用処理追加禁止
- メタ処理禁止
- 最小差分で実装
- シート直接操作禁止
- HTML → GAS API → Sheet 構造厳守

---

## DONE CONDITION（完了条件）

- UIから商品登録できる
- 登録後、一覧に反映される
- 「データなし」状態から変化する
- エラーが発生しない
- APIファイルに変更が入らない

---

## OUTPUT FORMAT（必須）

- 変更ファイル名
- 差分要約
- diff --git 形式の実装差分

---

## NG（絶対禁止）

- 調査してください
- 確認してください
- テストしてください
- 原因を特定してください
- 必要に応じて修正
- 適切に対応
- 推測・憶測で実装
- 勝手な追加処理
- 複数目的の混在

---
---
## MODE
DIRECT / PLAN
# ALTANA AI FACTORY ISSUE

---

## MODE

DIRECT / PLAN

### DIRECT 条件
・変更ファイル 1つ  
・TASK 3以下  
・軽微修正  
・単一関数追加/修正/削除  

### PLAN 条件
・変更ファイル 複数  
・TASK 4以上  
・機能追加  
・構造変更  
・API追加  
・削除 + 追加 + 移動 を含む  

---

## GOAL

このIssueの目的

例

商品一覧取得APIを作成する

---

## CHANGE TYPE

追加  
修正  
削除  
移動  

※複数可

---

## PROJECT

例

NETSHOP_GAS  
ALTANA_GAS  

---

## MODULE

例

API  
UI  
DATABASE  

---

## TARGET FILE

変更対象ファイル

例

20_api_netshop.gs  
10_webapp.gs  

---

## TASK

TASK1

TASK2

TASK3

TASK4

例

TASK1  
10_webapp.gs  
api_listItems 削除  

TASK2  
20_api_netshop.gs  
api_listItems 追加  

---

## SPEC

実装仕様

例

API名  
api_listItems(filter)

処理  

管理シート取得  
商品一覧返却  

---

## EXPECT RESULT

実装後の状態

例

api_listItems は  
20_api_netshop.gs のみ存在  

---

## REVIEW CHECK

AIレビュー確認項目

・関数重複  
・削除タスク確認  
・追加タスク確認  
・移動タスク確認  

---

## NOTE

重要ルール

HTMLはシートを直接操作しない

HTML  
↓  
GAS API  
↓  
Spreadsheet


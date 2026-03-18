# ALTANA AI FACTORY ISSUE（実装専用）

---

## MODE
DIRECT

---

## GOAL
api_createItem を実装し、商品データをシートへ追加できるようにする

---

## CHANGE TYPE
追加

---

## PROJECT
NETSHOP_GAS

---

## MODULE
API

---

## TARGET FILE
20_api_netshop.gs

---

## CHANGE DETAIL（実装内容）

1. 新規関数 api_createItem(payload) を追加

2. 処理内容
- Spreadsheet を取得
- CONFIG.SHEET_NAME のシートを取得
- 新規IDを生成
- 初期ステータスを設定
- payload の値を使用して1行データを作成
- appendRow でシートに追加

3. 戻り値
- 追加したデータ（またはID）

---

## CONSTRAINT（制約）

- 既存関数の変更禁止
- CONFIG.COLS を使用すること
- 列番号のハードコード禁止
- 最小差分で実装
- シート直接操作はこの関数内のみ許可
- HTMLとの直接結合禁止

---

## DONE CONDITION（完了条件）

- api_createItem が存在する
- シンタックスエラーがない
- GASから呼び出し可能な global 関数である
- 既存の api_listItems に影響がない

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
- 必要に応じて修正
- 推測・憶測で実装
- 既存コードの変更
- 複数ファイル変更

---

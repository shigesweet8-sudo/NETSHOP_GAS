# ALTANA AI FACTORY ISSUE（実装専用）

## MODE
DIRECT

## GOAL
api_updateItem を実装し、ID指定で既存データを更新できるようにする

## CHANGE TYPE
追加

## PROJECT
NETSHOP_GAS

## MODULE
API

## TARGET FILE
20_api_netshop.gs

---

## CHANGE DETAIL（実装内容）

1. 新規関数 api_updateItem(id, payload) を追加

2. 処理内容
- Spreadsheet を取得
- CONFIG.SHEET_NAME のシートを取得
- 全データを取得
- ID列から対象行を検索
- 該当行に対して payload の値で上書き更新

3. 戻り値
- 更新結果（成功 / 失敗 または更新データ）

---

## CONSTRAINT（制約）

- 既存関数の変更禁止
- CONFIG.COLS を使用すること
- 列番号のハードコード禁止
- 最小差分で実装
- シート操作はこの関数内のみ
- HTMLとの直接結合禁止

---

## DONE CONDITION（完了条件）

- api_updateItem が存在する
- 指定IDのデータが更新できる
- シンタックスエラーがない
- 既存の api_createItem / api_listItems に影響がない

---

## OUTPUT FORMAT

- 変更ファイル名
- 差分要約
- diff --git

---

## NG

- 調査指示
- 確認指示
- テスト指示
- 推測実装
- 既存関数変更
- 複数ファイル変更

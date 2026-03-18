# ALTANA AI FACTORY ISSUE（実装専用）

## MODE
DIRECT

## GOAL
index.html から api_updateItem を呼び出せるようにする

## CHANGE TYPE
修正

## PROJECT
NETSHOP_GAS

## MODULE
WEB UI

## TARGET FILE
index.html

---

## CHANGE DETAIL（実装内容）

1. 更新ボタンを追加

2. 更新処理関数を追加

3. ボタンクリック時に api_updateItem を呼び出す

4. id と payload は固定値で構築する
（UI入力はまだ使用しない）

---

## CONSTRAINT（制約）

- API変更禁止
- index.html 以外の変更禁止
- UI入力取得は実装しない
- id と payload は固定値で作成
- google.script.run を使用する
- 最小差分で実装
- debugコード追加禁止
- テスト用処理追加禁止

---

## DONE CONDITION（完了条件）

- ボタンクリックで api_updateItem が呼ばれる
- エラーが発生しない
- 既存の登録・一覧機能に影響がない

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
- 必要に応じて修正
- 推測・憶測で実装
- APIファイル変更
- 複数ファイル変更

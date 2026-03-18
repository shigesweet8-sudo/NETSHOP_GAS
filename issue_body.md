# ALTANA AI FACTORY ISSUE（実装専用）

## MODE
DIRECT

## GOAL
フォーム入力値を取得して api_createItem に渡し、登録後に一覧を更新する

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

1. 入力要素に id を付与
- 商品名 input
- 仕入金額 input
- 販売金額 input
- 数量 input

2. 登録処理で入力値を取得し payload を構築
- 各 input の値を取得
- payload オブジェクトを作成

3. 登録ボタンクリックで api_createItem を呼び出し
- payload を渡す
- successHandler で api_listItems を呼び出し一覧更新

---

## CONSTRAINT（制約）

- API変更禁止
- index.html のみ変更
- 列番号の定義禁止（HTML側に持たせない）
- google.script.run を使用
- 既存の一覧描画処理を使用
- 最小差分
- debugコード禁止
- テスト処理禁止

---

## DONE CONDITION（完了条件）

- 入力値を取得できる
- api_createItem に payload が渡る
- 登録後に一覧が更新される
- 「データなし」から変化する
- 既存機能に影響なし

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
- API変更
- 複数ファイル変更

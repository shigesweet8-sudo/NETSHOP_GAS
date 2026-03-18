
# ALTANA AI FACTORY ISSUE（実装専用）

## MODE
DIRECT

## GOAL
api_createItem 実行後に api_listItems を再取得し、一覧を更新する

## CHANGE TYPE
修正

## PROJECT
NETSHOP_GAS

## MODULE
WEB UI

## TARGET FILE
index.html

## CHANGE DETAIL（実装内容）

1. api_createItem 呼び出しに successHandler を設定

2. successHandler 内で api_listItems を呼び出す

3. 取得結果を既存の一覧描画処理に渡す

---

## CONSTRAINT（制約）

- API変更禁止
- index.html のみ変更
- 新規API追加禁止
- 既存描画関数を使用する
- 最小差分
- debugコード禁止
- テスト処理禁止

---

## DONE CONDITION（完了条件）

- 登録ボタン押下で api_createItem 実行
- 実行後に api_listItems が呼ばれる
- 一覧が再描画される
- 既存一覧表示に影響がない

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

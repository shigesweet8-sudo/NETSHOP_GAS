TITLE
WAVE STEP2-2 UI→API接続（api_createItem 呼び出し）

---

# ALTANA AI FACTORY ISSUE（実装専用）

## MODE
DIRECT

## GOAL
index.html から api_createItem を呼び出せるようにする

## CHANGE TYPE
修正

## PROJECT
NETSHOP_GAS

## MODULE
WEB UI

## TARGET FILE
index.html

## CHANGE DETAIL（実装内容）

1. 登録ボタンを追加

2. 登録処理関数を追加

3. ボタンクリック時に api_createItem を呼び出す

4. payload は固定値で構築する

## CONSTRAINT（制約）

- API変更禁止
- index.html 以外の変更禁止
- UI入力取得は実装しない
- payloadは固定値
- google.script.run を使用
- 最小差分
- debugコード禁止
- テスト処理禁止

## DONE CONDITION（完了条件）

- ボタン押下で api_createItem が呼ばれる
- エラーが発生しない
- 既存 api_listItems に影響なし

## OUTPUT FORMAT

- 変更ファイル名
- 差分要約
- diff --git

## NG

- 調査指示
- 確認指示
- テスト指示
- 推測実装
- API変更
- 複数ファイル変更


# ALTANA AI FACTORY ISSUE（実装専用）

## MODE
DIRECT

## GOAL
既存機能を配置し、WAVE画面として成立するレイアウトを作成する

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

1. ヘッダーエリアを追加
- タイトル「WAVE NETSHOP」

2. 登録エリアを作成
- 既存の入力フォームと登録ボタンを配置

3. 一覧エリアを作成
- 既存の一覧表示部分を配置

4. 各エリアを縦構造で整理
- ヘッダー
- 登録
- 一覧

---

## CONSTRAINT（制約）

- API変更禁止
- index.html のみ変更
- 既存の登録処理・一覧処理は変更しない
- 新規ロジック追加禁止
- レイアウトのみ変更
- 最小差分
- debugコード禁止
- テスト処理禁止

---

## DONE CONDITION（完了条件）

- ヘッダーが表示される
- 登録エリアが分離されて表示される
- 一覧エリアが分離されて表示される
- 既存の登録・一覧機能がそのまま動作する

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

# ALTANA AI FACTORY ISSUE

## MODE
DIRECT

## GOAL
（1行で明確に）
例：index.html から api_updateItem を呼び出す

---

## PROJECT
NETSHOP_GAS

## MODULE
UI / API / DATABASE（いずれか1つ）

---

## TARGET FILE
（必ず1ファイル）
例：
index.html

---

## CHANGE TYPE
追加 / 修正 / 削除（該当のみ）

---

## IMPLEMENTATION

（やることを具体的に列挙）

1.
（何を追加/変更するか）

2.
（どう動くようにするか）

3.
（必要なら処理の流れ）

---

## FIXED SPEC

（固定条件・ブレ防止）

- 使用API：
- 使用関数：
- 引数：
- 戻り値：
- UI挙動：

※ここを曖昧にしない

---

## SCOPE

（触っていい範囲）

- 対象ファイルのみ変更
- 他ファイル変更禁止

---

## NON-SCOPE

（絶対に触らない範囲）

- GAS API変更禁止
- Spreadsheet変更禁止
- 既存ロジック変更禁止

---

## STRICT RULES

- 最小差分
- 既存構造を変更しない
- create と同じ思想で実装
- 単一ファイルのみ
- 憶測禁止
- 追加実装禁止
- debugコード禁止
- テストコード禁止

---

## ACCEPTANCE CRITERIA

（完成判定を明確に）

- ○○が存在する
- ○○が実行される
- ○○に影響がない
- 変更ファイルが1つのみ

---

## OUTPUT FORMAT

- diff --git 形式
- 最小差分のみ
- 説明文不要

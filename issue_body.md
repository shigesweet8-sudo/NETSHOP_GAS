# ALTANA AI FACTORY ISSUE

## MODE
DIRECT

## GOAL
index.html から api_listItems を呼び出して一覧を表示できるようにする

## PROJECT
NETSHOP_GAS

## MODULE
UI

## TARGET FILE
index.html

## CHANGE TYPE
修正

## IMPLEMENTATION
1.
google.script.run で api_listItems を呼び出す処理を追加する

2.
withSuccessHandler で受け取った二次元配列を一覧表示する

3.
rows[0] をヘッダー行、rows[1] 以降をデータ行として描画する

## FIXED SPEC
- 呼び出すAPIは api_listItems のみ
- 通信方法は google.script.run
- 返り値は二次元配列として扱う
- HTMLはシートを直接操作しない
- GAS API 側は変更しない

## SCOPE
- index.html のみ変更

## NON-SCOPE
- 20_api_netshop.gs 変更禁止
- Spreadsheet 変更禁止
- create/update/dashboard 追加禁止

## STRICT RULES
- 最小差分
- 既存構造を変更しない
- 単一ファイルのみ
- 憶測禁止
- debugコード禁止
- テストコード禁止
- 追加実装禁止

## ACCEPTANCE CRITERIA
- index.html から api_listItems が呼ばれる
- 取得結果が一覧表示される
- 変更ファイルは index.html のみ

## OUTPUT FORMAT
- diff --git 形式
- 最小差分のみ
- 説明文不要

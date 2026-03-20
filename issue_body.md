# ALTANA AI FACTORY ISSUE

## MODE
DIRECT

## GOAL
NETSHOP_GAS の WAVE Phase1 正式番号 [6] として、
一括ステータス更新APIを 20_api_netshop.gs に追加する。

## PROJECT
NETSHOP_GAS

## MODULE
API

## CHANGE TYPE
追加
修正

## TARGET FILE
20_api_netshop.gs

## TASKS
1.
bulkUpdateItemStatus(items) を追加する
- 入力は配列
- 各要素は { id, status } を想定
- id は管理ID
- status は CONFIG.STATUS_LIST の既存ステータスのみ許可
- 空配列や不正入力はエラーにする

2.
既存の updateItemStatus の業務ルールを流用して、
対象行の A列ステータスを更新する
- D列 DATE は更新日時として更新する
- status が「商品登録」で、E列 商品登録日 が空の場合のみ E列を設定する
- 既存データの他列は変更しない

3.
API公開用の薄いラッパを追加する
- 既存命名に合わせる
- 戻り値は success / updatedCount / items など最小限でよい
- 個人情報列は返さない

## ACCEPTANCE CRITERIA
- 20_api_netshop.gs のみ変更
- 一括で複数 id のステータス更新ができる
- D列 DATE 更新ロジックが入る
- E列 商品登録日 固定ロジックが入る
- 個人情報を返さない
- 構文エラーがない

## CONSTRAINTS
- 変更対象は 20_api_netshop.gs のみ
- 既存の listItems / getItem / createItem / updateItem / updateItemStatus は壊さない
- UIファイルは触らない
- 新規ライブラリ追加禁止
- 推測で列構成を増やさない
- 最小差分で実装する

## NOTES
- 正式番号ベースでは [6] 一括ステータス更新API
- Spreadsheet の中核シートは「統合売上データ」
- 業務ルールは既存仕様に合わせる
- D列 = DATE（ステータス更新日時）
- E列 = 商品登録日（status が 商品登録 かつ空のときのみ設定）

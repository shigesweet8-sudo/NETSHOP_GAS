# ALTANA AI FACTORY ISSUE

## MODE
DIRECT

## GOAL
NETSHOP_GAS の WAVE Phase1 正式番号 [6] として、一括ステータス更新APIを追加する

## CHANGE TYPE
追加

## PROJECT
NETSHOP_GAS

## MODULE
API

## TARGET FILE
20_api_netshop.gs

## CONTEXT
既存の単体ステータス更新API [5] updateItemStatus は存在している
次は正式番号順に [6] 一括ステータス更新API を実装する
既存業務仕様では、統合売上データのステータス更新時に D列 DATE を更新する
また、ステータスが「商品登録」で E列が空の場合のみ、E列 商品登録日を初回固定する
今回の一括更新でも、この既存ルールを崩さず継承すること

## TASKS
1. 20_api_netshop.gs に一括ステータス更新APIを追加する
2. 複数の管理IDを受け取り、同一ステータスへ一括更新できるようにする
3. 更新時は既存の単体更新と同じ業務ルールを守る
   - ステータス更新時に D列 DATE を更新
   - ステータスが「商品登録」かつ E列が空のときのみ E列 商品登録日を設定
4. 返却値は、成功件数・失敗件数・対象ID一覧が分かる最小限のJSONにする
5. 既存の単体 updateItemStatus を壊さない

## CONSTRAINTS
- 変更対象は 20_api_netshop.gs のみ
- 他ファイル変更禁止
- 最小差分
- 既存構造を壊さない
- 推測で列構成を増やさない
- 個人情報列の新規返却禁止
- 実コードdiffを必ず含める
- diff --git 形式で出力

## DONE CONDITION
- 20_api_netshop.gs に [6] 一括ステータス更新API が追加される
- 複数IDに対して同一ステータス更新の処理が存在する
- D列 DATE 更新ロジックが入っている
- 「商品登録」初回時のみ E列 商品登録日固定ロジックが入っている
- PR に .gs の実コード差分が含まれる

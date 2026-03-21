## 背景
UI設計前の確認で、API の成功 / 失敗レスポンス形式が完全には統一されていないことが分かった。
今回のレビューでも、個別の差分より「エラー形式の一貫性」が論点になっており、今後の UI 実装と運用安定性のために API レスポンスを最適化する。

## 目的
UI が安全に扱えるよう、API の成功 / 失敗レスポンス形式を統一し、レスポンス仕様のブレをなくす。

## 実装対象ファイル
- `20_api_netshop.gs`

## 必須実装
- UI 利用を想定する API の成功レスポンス形式を統一する
- UI 利用を想定する API の失敗レスポンス形式を統一する
- 少なくとも以下の観点を揃える
  - `ok`
  - `error`
  - `data` または主結果の格納位置
- 配列直返し、文字列直返し、オブジェクト返しが混在しないようにする
- 既存の UI / 呼び出し側で破壊的変更になりにくい形で整理する
- 必要なら互換維持のための移行的な戻り値も検討する

## 対象API
- listItems
- getItem
- createItem
- updateItem
- updateItemStatus
- bulkUpdateStatus
- recalculateItemProfit
- bulkRecalculateProfit
- getMonthlySummary
- getPlatformSummary
- getDashboardSummary
- getMasters
- validateVariation
- exportCsv
- 郵便番号補完 API
- disable / archive / cancel 系 API

## 業務ルール
- UI が共通ハンドラで扱いやすい形式にすること
- 既存 API 基盤を壊さないこと
- 破壊的変更になる場合は互換維持を優先すること
- シート内部仕様は API レスポンスに漏らさないこと

## 完了条件
- UI利用対象 API のレスポンス形式が整理されること
- 成功時と失敗時の構造が API 間で一貫すること
- `20_api_netshop.gs` に実コード差分が入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- シート構造変更

## 注意
- 調査ではなく実装 / 最適化 Issue
- 1 Issue = 1テーマ
- 対象外の機能を混ぜないこと


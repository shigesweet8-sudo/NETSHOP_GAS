## 背景
NETSHOP GAS の Web化を進めるにあたり、現在の API は取得系が日本語ヘッダキー、更新系が英字キー前提となっており、API 境界のスキーマが非対称になっている。
Web UI から安定して扱えるように、公開スキーマを英字キーへ統一する。

## 目的
API 入出力を英字キーへ統一し、取得系と更新系のスキーマを揃える。

## 実装対象ファイル
- `20_api_netshop.gs`

## 必須実装
- 公開レスポンスを英字キーで返す共通変換を追加する
- 少なくとも以下を英字キーへ統一する
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
  - getMasters
  - validateVariation
- シート内部では日本語ヘッダを使ってよいが、API公開面では英字キーへ統一する
- 個人情報除外ルールは維持する

## 業務ルール
- 既存の業務値や意味を変えないこと
- Web UI から取得結果をそのまま更新系に渡しやすい構造にすること
- 既存 API 基盤を壊さないこと

## 完了条件
- 取得系と更新系でキー体系が一致すること
- `20_api_netshop.gs` に実コード差分が入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- シート列名変更

## 注意
- 調査ではなく実装 Issue
- 1 Issue = 1機能
- 対象外の機能を混ぜないこと


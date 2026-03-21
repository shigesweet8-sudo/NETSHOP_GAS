## 背景
NETSHOP GAS の Web化を進めるにあたり、現在の API 実装では「読み取りはヘッダ名依存」「書き込みは固定列番号依存」が混在している。
この状態では、シート列順変更時に静かに誤更新するリスクがあるため、列参照方式を統一する。

## 目的
シート列参照をヘッダ解決ベースへ統一し、列順変更耐性を持たせる。

## 実装対象ファイル
- `20_api_netshop.gs`
- 必要に応じて `01_config.gs`

## 必須実装
- ヘッダ名から列位置を解決する共通処理を追加する
- 更新系 API も固定列番号ではなくヘッダ解決結果を使うようにする
- 少なくとも以下の処理で参照方式を統一する
  - createItem
  - updateItem
  - updateItemStatus
  - bulkUpdateStatus
  - recalculateItemProfit
  - bulkRecalculateProfit
  - cancelItem
  - bulkDisableNetshopRecords

## 業務ルール
- シート名は `統合売上データ`
- シートヘッダは `CONFIG.HEADERS` と整合すること
- 列順が変わっても誤更新しないこと
- 既存 API の業務ロジックは壊さないこと

## 完了条件
- 更新系 API が固定列番号直書きに依存しないこと
- 実コード差分が `20_api_netshop.gs` に入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- API 公開スキーマ変更


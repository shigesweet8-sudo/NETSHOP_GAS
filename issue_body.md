## 背景
API 公開スキーマを英字キーへ統一する作業が未完了です。
現在も listItems / getItem が日本語ヘッダキーを返しており、取得系と更新系のスキーマが一致していません。
このズレを解消します。

## 目的
取得系 API の公開レスポンスを英字キーへ統一し、更新系と同じキー体系に揃える。

## 実装対象ファイル
- `20_api_netshop.gs`

## 必須実装
- listItems の返却を英字キーへ統一する
- getItem の返却を英字キーへ統一する
- createItem / updateItem / updateItemStatus / bulkUpdateStatus / recalculateItemProfit / bulkRecalculateProfit とキー体系を一致させる
- 個人情報除外ルールは維持する
- 日本語ヘッダキーを公開レスポンスで返さない

## 完了条件
- listItems が英字キーで返ること
- getItem が英字キーで返ること
- 取得系と更新系で同じキー体系になること
- `20_api_netshop.gs` に実コード差分が入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- シート列名変更

## 注意
- 調査ではなく実装 Issue
- 1 Issue = 1機能
- 対象外の機能を混ぜないこと


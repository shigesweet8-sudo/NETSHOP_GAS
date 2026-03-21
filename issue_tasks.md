1. `20_api_netshop.gs` に UI 向け共通レスポンス生成ヘルパーを追加し、成功 / 失敗の標準フォーマット（`ok`, `error`, `data`）と互換維持用の戻り値ルールを実装する
2. 対象 API（`listItems`, `getItem`, `createItem`, `updateItem`, `updateItemStatus`, `bulkUpdateStatus`, `recalculateItemProfit`, `bulkRecalculateProfit`）の返却値を共通レスポンスヘルパー経由へ置き換え、配列直返し・文字列直返し・生オブジェクト返しを解消する
3. 対象 API（`getMonthlySummary`, `getPlatformSummary`, `getDashboardSummary`, `getMasters`, `validateVariation`, `exportCsv`, 郵便番号補完 API, disable / archive / cancel 系 API）の返却値と例外処理を共通レスポンス形式へ統一し、既存呼び出し互換に配慮した最終調整を行う

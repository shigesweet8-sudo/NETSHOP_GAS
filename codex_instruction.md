1. 20_api_netshop.gs に bulkUpdateItemStatus(items) 関数を追加する。
   - 関数は配列を引数に取り、各要素は { id, status } であることを想定。
   - id は管理ID、status は CONFIG.STATUS_LIST の既存ステータスを使用。
   - 空配列や不正入力の場合はエラーを返すようにする。

2. 既存の updateItemStatus のロジックを流用し、対象行の A列のステータスを更新する。
   - D列 DATE は現在時刻を更新日時として設定する。
   - status が「商品登録」で、E列の商品登録日が空である場合のみ E列を設定する。
   - 他の列のデータは変更しない。

3. API公開用の薄いラッパを追加する。
   - 既存の命名規則に従い、戻り値として success, updatedCount, items などの最小限の情報のみ返すように実装する。
   - 個人情報列は返さないようにする。

## 目的
`cancelItem` を業務上のキャンセル処理として維持しつつ、`bulkDisableNetshopRecords` / `api_bulkDisableNetshop` を運用上の無効化処理として分離し、API 名・返却値・処理内容の意味を一致させる。

## 実装スコープ
- `20_api_netshop.gs` にて、キャンセル処理と disable/archive 処理を明確に分離する。
- `bulkDisableNetshopRecords` が `CONFIG.STATUS.CANCEL` を直接設定する実装になっている場合は、それをやめて無効化専用処理へ置き換える。
- 必要に応じて `01_config.gs` に disable/archive 用の定数を追加または整理する。
- 既存 API 基盤は壊さず、存在しない ID は安全に失敗として返す。
- 既存データの物理削除は行わない。

## 対象ファイル
- `20_api_netshop.gs`
- 必要に応じて `01_config.gs`
- 関連する共通更新関数が同一責務で存在する場合は、その実装ファイルも候補として最小限変更してよい

## 制約
- 実装は調査メモではなく、実コード変更を伴うこと。
- `cancel = 業務ステータス変更`、`disable / archive = 表示・管理上の無効化` の業務ルールを厳守すること。
- 既存 API の呼び出し基盤やレスポンス形式は、必要最小限の変更に留めること。
- 存在しない ID や更新対象なしのケースは、安全に失敗結果を返すこと。
- `bulkDisableNetshopRecords` を単なる cancel の別名にしないこと。
- 不明点がある場合は、既存コードの命名・返却形式に合わせて最も保守的に実装すること。

## 非対象
- UI 実装
- 物理削除の追加
- Issue にない別機能の修正
- md/json/txt のみを変更して終了すること

## 実装ステップ
1. `20_api_netshop.gs` の `cancelItem`、`bulkDisableNetshopRecords`、`api_bulkDisableNetshop` の現在の更新対象列・更新値・返却値を確認し、cancel と disable/archive が同じ処理になっている箇所を分離する。
2. `cancelItem` は従来どおり業務ステータス更新として残し、`CONFIG.STATUS.CANCEL` を使うべき箇所を cancel 系のみに限定する。
3. disable/archive 用の状態表現を既存コードから再利用できるならそれを使い、なければ `01_config.gs` に無効化用の定数を追加する。業務ステータス列を cancel に変えるのではなく、表示・管理上の無効化を表す列または既存管理フラグへ反映する実装にする。
4. `bulkDisableNetshopRecords` / `api_bulkDisableNetshop` を、名称どおり無効化処理を行う API として実装し直す。必要なら内部ヘルパーを追加し、複数 ID の処理結果を返せるよう整理する。
5. 存在しない ID、更新対象が見つからない ID は、安全に失敗として返す。既存レスポンス形式がある場合はそれに合わせて `success/failed` や件数、対象 ID を返す。
6. 既存の cancel API と disable API の意味がコード上で読み取れるよう、関数名・内部コメント・返却項目名を最小限整理する。ただし外部互換を壊す不要なリネームは避ける。
7. 変更後の処理が物理削除を行っていないこと、disable 系が `CONFIG.STATUS.CANCEL` 直設定で終わっていないことを確認する。

## 完了条件
- `20_api_netshop.gs` に実コード差分がある。
- `cancelItem` が業務キャンセル処理として残っている。
- `bulkDisableNetshopRecords` / `api_bulkDisableNetshop` が cancel と同義ではなく、無効化専用の処理になっている。
- disable/archive 系が `CONFIG.STATUS.CANCEL` 直呼びで終わっていない。
- 存在しない ID を安全に失敗として返す。
- 物理削除を実装していない。
- `md/json/txt` だけの変更で終わっていない。

## 検証
- `cancelItem` 実行時に、対象レコードが業務ステータス `CANCEL` 相当に更新されることを確認する。
- `bulkDisableNetshopRecords` / `api_bulkDisableNetshop` 実行時に、対象レコードが cancel ではなく無効化状態になることを確認する。
- disable API 実行後も、業務ステータスが不要に `CANCEL` へ変更されていないことを確認する。
- 存在しない ID を含む入力で、処理全体が異常終了せず、該当 ID が失敗として返ることを確認する。
- 既存の API 呼び出し経路で実行エラーが発生しないことを確認する。

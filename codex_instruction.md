## 目的
`archiveItem` と `disableItem` を別の業務意味を持つ API として実装上も分離し、`archiveItemById` が `disableItemById` の単純別名にならないように修正する。返却値の `action` / `operation` もそれぞれの意味に一致させる。

## 実装スコープ
- `disableItem` を「表示・管理上の一時無効化」として明確化する
- `archiveItem` を「保管・退避状態」として明確化する
- `archiveItemById` を独立した処理経路に変更する
- 一括無効化 API の意味を `disable` 側に統一する
- 既存 API 基盤や `doPost` には手を入れない
- 既存データの物理削除は行わない

## 対象ファイル
- 必須: `20_api_netshop.gs`
- 必要に応じて: `01_config.gs`
- 既存のステータス定数、操作名定数、レスポンス生成処理、ID指定更新処理、一覧/一括更新処理の周辺実装を確認して修正対象に含めること

## 制約
- `doPost` は新規追加・置換しない
- 既存 API の呼び出し基盤を壊さない
- `archiveItemById` を `disableItemById` 呼び出しだけで済ませない
- `action` / `operation` は `disable` と `archive` で意味どおりに分ける
- 物理削除はしない
- 情報不足の場合は既存コードの命名・データ構造に合わせて最小限の拡張を行う
- 最後を `codex_instruction.md` / `issue_tasks.md` / `openai_response.json` だけの変更で終わらせない

## 非対象
- UI 実装
- 物理削除処理の追加
- `cancel` / `operationalDisable` の意味変更
- Issue に記載のない別 API の整理や全面リファクタ

## 実装ステップ
1. `20_api_netshop.gs` で `disableItem` / `disableItemById` / 一括無効化 API の実装を確認し、「一時無効化」を表す内部状態・更新値・レスポンス `action` / `operation` に統一する。
2. `archiveItem` / `archiveItemById` が `disable` 系の別名や流用実装になっている箇所を特定し、`archive` 専用の処理経路へ分離する。
3. 既存のデータ更新処理に合わせて、`archive` 用の状態値または操作種別を追加・分岐し、`disable` と混同しないようにする。必要なら `01_config.gs` に定数を追加する。
4. `archiveItemById` は ID 指定更新を独自に実行し、返却値の `action` / `operation` を `archive` 系の意味に合わせる。
5. 一括無効化 API が `archive` 的な名称・操作値を返している場合は、`disable` の意味に揃えて修正する。
6. 既存レスポンス形式は維持しつつ、`archiveItem` と `disableItem` の応答内容がコード上で明確に異なることを保証する。
7. 変更後、関連する呼び出し経路で構文崩れや参照漏れがないように整える。

## 完了条件
- `20_api_netshop.gs` に実コード差分がある
- `disableItem` が「一時無効化」として扱われる
- `archiveItem` が「保管・退避」として扱われる
- `archiveItemById` が `disableItemById` の単純別名ではない
- `action` / `operation` が `disable` と `archive` で意味どおりに分離されている
- 一括無効化 API が `disable` 側の意味に統一されている
- `doPost` は追加されていない
- `md/json/txt` だけの変更ではなく、実装ファイルに変更が入っている

## 検証
- `20_api_netshop.gs` 内で `archiveItemById` が `disableItemById` を直接返すだけの実装でないことを確認する
- `disable` 系 API のレスポンス `action` / `operation` が `disable` 系名称になっていることを確認する
- `archive` 系 API のレスポンス `action` / `operation` が `archive` 系名称になっていることを確認する
- 一括無効化 API の更新内容と返却値が `disable` の意味に一致することを確認する
- Apps Script として最低限の構文整合性が取れていることを確認する

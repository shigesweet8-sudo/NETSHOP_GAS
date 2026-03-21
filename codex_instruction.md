## 目的
NETSHOP API の公開入出力スキーマを英字キーへ統一し、取得系レスポンスと更新系リクエストで同じキー体系を使えるようにする。`20_api_netshop.gs` に実コード差分を入れ、シート内部の日本語ヘッダは維持したまま API 境界だけを英字キー化する。

## 実装スコープ
- `20_api_netshop.gs` 内で、公開レスポンスを英字キーへ変換する共通処理を追加する
- 少なくとも以下の API で、返却データのキーを英字キーへ統一する
  - `listItems`
  - `getItem`
  - `createItem`
  - `updateItem`
  - `updateItemStatus`
  - `bulkUpdateStatus`
  - `recalculateItemProfit`
  - `bulkRecalculateProfit`
  - `getMonthlySummary`
  - `getPlatformSummary`
  - `getMasters`
  - `validateVariation`
- 更新系 API が既に英字キー前提である場合は、そのキー体系に合わせて取得系レスポンスを揃える
- シート読み書き時の日本語ヘッダ利用は維持する
- 既存の個人情報除外ルールを維持する

## 対象ファイル
- 必須: `20_api_netshop.gs`
- 追加候補: なし（本 Issue の対象ファイルは `20_api_netshop.gs` に限定する）

## 制約
- 既存の業務値・計算結果・意味を変えないこと
- 既存 API 基盤やレスポンス全体構造を壊さないこと
- API 公開面だけを英字キーへ統一し、シート列名変更は行わないこと
- 英字キー名は、既存の更新系 API が受け取るキー名に一致させること
- 個人情報除外ロジックが既存で入っている場合、それを迂回・緩和しないこと
- 情報不足がある場合は、`20_api_netshop.gs` 内の既存更新系マッピング・バリデーション・レスポンス生成箇所を根拠に最小限の整合的なキー定義を行うこと

## 非対象
- UI 実装
- シート列名変更
- 他ファイルへの大規模な責務分割
- API の業務仕様変更
- ドキュメントのみの更新

## 実装ステップ
1. `20_api_netshop.gs` を確認し、更新系 API が前提としている英字キーと、取得系で現在返している日本語キーの対応関係を整理する。
2. 日本語ヘッダの内部オブジェクトを API 公開用の英字キーへ変換する共通関数を `20_api_netshop.gs` に実装する。
   - 単一アイテム変換
   - 配列変換
   - 必要に応じてネストしたレスポンス内の対象配列/オブジェクト変換
   - 個人情報除外後のデータ、または個人情報除外ルールと両立する位置で適用する
3. 既存の更新系 API で使用している英字キー定義を流用または一本化し、取得系・更新系で同じキー名セットを使うようにする。
4. 以下の各関数の返却処理を修正し、公開レスポンスが英字キーになるようにする。
   - `listItems`
   - `getItem`
   - `createItem`
   - `updateItem`
   - `updateItemStatus`
   - `bulkUpdateStatus`
   - `recalculateItemProfit`
   - `bulkRecalculateProfit`
   - `getMonthlySummary`
   - `getPlatformSummary`
   - `getMasters`
   - `validateVariation`
5. 各 API について、返却オブジェクトのメタ情報や `success` / `message` などの共通レスポンス枠が既存である場合は維持し、業務データ部分のみ必要に応じて英字キー化する。
6. 取得結果をそのまま更新系へ渡しやすい構造になっているかを確認し、`getItem` / `listItems` の item オブジェクトと `createItem` / `updateItem` 周辺の item オブジェクトでキー不一致が残らないように調整する。
7. 既存ロジックを壊さない範囲で、変換漏れや二重変換を防ぐために共通関数の適用箇所を整理する。

## 完了条件
- `20_api_netshop.gs` に実コード差分が存在する
- 指定された API の公開レスポンスが英字キーへ統一されている
- 取得系と更新系で同じキー体系を使用できる
- シート内部では日本語ヘッダ利用が維持されている
- 個人情報除外ルールが維持されている
- 既存の業務値・計算値・意味が変わっていない
- `codex_instruction.md` / `issue_tasks.md` / `openai_response.json` だけを変更して終わらせないこと

## 検証
- `20_api_netshop.gs` 内で、各対象 API の返却値生成箇所を確認し、日本語キーのまま公開している箇所が残っていないことを確認する
- `listItems` と `getItem` の item データが、`createItem` / `updateItem` の入力キー体系と整合していることを確認する
- `updateItemStatus` / `bulkUpdateStatus` / `recalculateItemProfit` / `bulkRecalculateProfit` の返却データも英字キーに揃っていることを確認する
- `getMonthlySummary` / `getPlatformSummary` / `getMasters` / `validateVariation` のレスポンス内データも必要な範囲で英字キー化されていることを確認する
- 個人情報除外対象の項目がレスポンスに混入していないことを確認する
- 可能なら GAS 上で対象関数のレスポンス例を目視確認し、取得結果を更新系へそのまま渡しやすい構造になっていることを確認する

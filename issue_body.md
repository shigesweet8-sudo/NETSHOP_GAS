検証しました。今回は **OK** です。

- [20_api_netshop.gs](/c:/DEV/ALTANA_DEV_FACTORY/projects/NETSHOP_GAS/20_api_netshop.gs) は構文OKです
- `listItems` / `getItem` は [buildPublicItemFromRow_](/c:/DEV/ALTANA_DEV_FACTORY/projects/NETSHOP_GAS/20_api_netshop.gs#L199) を通して英字キー返却になっています
- `applyFilter_` も [convertFilterKeysToApi_](/c:/DEV/ALTANA_DEV_FACTORY/projects/NETSHOP_GAS/20_api_netshop.gs#L82) で日本語/英字どちらからでも絞り込みできる形に寄っています
- ローカル `master` は `origin/master` と一致しているので、**push は不要** です

次へ進みます。次は `getMasters の正式参照元固定` です。

```md
## 背景
現在の getMasters は、ステータス以外をシート入力規則や現存データから返しており、正式マスター API として不安定です。
Web UI の基盤として使うため、参照元を固定します。

## 目的
getMasters の正式参照元を固定し、常に安定したマスター一覧を返せるようにする。

## 実装対象ファイル
- `20_api_netshop.gs`
- 必要に応じて `01_config.gs`

## 必須実装
- ステータス、ショップ、担当者、配送元、配送業者の正式参照元を固定する
- シート現存値や入力規則への依存を減らす
- getMasters / api_getMasters が正式マスターを返すようにする
- 未定義マスターは安全に空配列で返す

## 業務ルール
- 返却値は Web UI でそのまま使える形式にする
- 業務上の正式候補と一致すること
- シートに未使用の候補も必要なら返せること
- 既存 API 基盤を壊さないこと

## 完了条件
- getMasters の参照元が固定化されること
- 実コード差分が入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- マスター画面の新規作成

## 注意
- 調査ではなく実装 Issue
- 1 Issue = 1機能
- 対象外の機能を混ぜないこと
```

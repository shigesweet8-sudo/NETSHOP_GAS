## 背景
現在は `cancel` と `operationalDisable` は分離できているが、`archive` と `disable` はまだ同一実装の別名になっている。
将来の UI 拡張や運用ルール追加に備え、`archive` と `disable` の意味も明確に分離する。

## 目的
`archiveItem` と `disableItem` を別業務意味の API として整理し、将来の意味衝突を防ぐ。

## 実装対象ファイル
- `20_api_netshop.gs`
- 必要に応じて `01_config.gs`

## 必須実装
- `disableItem` を「運用上の一時的な無効化」として明確化する
- `archiveItem` を「保管・アーカイブ状態」として明確化する
- `archiveItemById` を `disableItemById` の単純別名で終わらせない
- 返却値の `action` / `operation` が意味どおりになるよう整理する
- 一括無効化 API は `disable` 側の意味に揃える
- `doPost` は新規追加しない

## 業務ルール
- cancel = 業務ステータス変更
- disable = 表示・管理上の一時無効化
- archive = 保管・退避の意味
- 既存データを物理削除しない
- 既存 API 基盤を壊さないこと

## 完了条件
- `archiveItem` と `disableItem` がコード上で別意味として扱われること
- `archiveItemById` が `disableItemById` の単純別名でないこと
- `20_api_netshop.gs` に実コード差分が入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- 物理削除の強行実装

## 注意
- 調査ではなく実装 Issue
- 1 Issue = 1機能
- 対象外の機能を混ぜないこと


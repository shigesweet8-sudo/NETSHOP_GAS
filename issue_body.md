## 背景
現在の実装では、cancelItem と bulkDisableNetshopRecords がどちらも `キャンセル` ステータスに寄っており、業務意味が混在している。
業務状態と運用上の無効化を分離する。

## 目的
cancelItem と archiveItem / disableItem の意味を分離し、業務状態と運用状態を混同しない API にする。

## 実装対象ファイル
- `20_api_netshop.gs`
- 必要に応じて `01_config.gs`

## 必須実装
- cancelItem を「業務上のキャンセル処理」として明確化する
- archiveItem または disableItem を「運用上の無効化処理」として分離する
- 一括無効化 API も cancel と同義にしない
- API 名、返却値、処理内容が意味どおりになるよう整理する

## 業務ルール
- cancel は業務ステータス変更
- archive / disable は表示・管理上の無効化
- 既存データを破壊しないこと
- 既存 API 基盤を壊さないこと

## 完了条件
- cancel と archive / disable の意味がコード上で分離されること
- 実コード差分が `20_api_netshop.gs` に入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- 物理削除の強行実装

## 注意
- 調査ではなく実装 Issue
- 1 Issue = 1機能
- 対象外の機能を混ぜないこと


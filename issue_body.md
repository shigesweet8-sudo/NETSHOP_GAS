## 背景
cancelItem と bulkDisableNetshopRecords がどちらも `キャンセル` ステータス更新になっており、業務状態と運用上の無効化が分離できていません。
このズレを解消します。

## 目的
cancelItem を業務上のキャンセル処理、disable/archive 系を運用上の無効化処理として明確に分離する。

## 実装対象ファイル
- `20_api_netshop.gs`
- 必要に応じて `01_config.gs`

## 必須実装
- cancelItem は業務上のキャンセル処理として維持する
- bulkDisableNetshopRecords / api_bulkDisableNetshop を cancel と同義にしない
- disable / archive 用の別処理を追加または整理する
- API 名、返却値、処理内容が意味どおりになるよう整理する
- 既存データを物理削除しない

## 業務ルール
- cancel = 業務ステータス変更
- disable / archive = 表示・管理上の無効化
- 既存 API 基盤を壊さないこと
- 存在しないIDは安全に失敗として返すこと

## 完了条件
- cancel と disable / archive の意味がコード上で分離されること
- bulkDisableNetshopRecords が `CONFIG.STATUS.CANCEL` 直呼びで終わっていないこと
- `20_api_netshop.gs` に実コード差分が入ること
- `md/json` だけの変更で終わらないこと

## 非対象
- UI 実装
- 物理削除の強行実装

## 注意
- 調査ではなく実装 Issue
- 1 Issue = 1機能
- 対象外の機能を混ぜないこと


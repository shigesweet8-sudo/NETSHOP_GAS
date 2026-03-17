# ALTANA AI FACTORY ISSUE

---
## MODE
PLAN

### DIRECT 条件
・変更ファイル 1つ  
・TASK 3以下  
・軽微修正  
・単一関数追加/修正/削除  

### PLAN 条件
・変更ファイル 複数  
・TASK 4以上  
・機能追加  
・構造変更  
・API追加  
・削除 + 追加 + 移動 を含む  

---

## GOAL
`wave_dashboard.html` を Bootstrap 5 と DataTables.js でリッチなUIに物理書き換えし、金額表示のフォーマット（カンマ区切り）を実装する。

---

## CHANGE TYPE
修正 / 構造変更

---

## PROJECT
NETSHOP_GAS  

---

## MODULE
UI / API  

---

## TARGET FILE
* `wave_dashboard.html`  
* `20_api_netshop.gs`  

---

## TASK
TASK1
`wave_dashboard.html`
Bootstrap 5 (CDN) および DataTables.js の導入。

TASK2
`wave_dashboard.html`
テーブルデザインの刷新とソート・検索機能の有効化。

TASK3
`wave_dashboard.html`
金額列に対する `.toLocaleString()` の適用（¥マーク・カンマ区切り）。

TASK4
`20_api_netshop.gs`
DataTablesが処理しやすいデータ形式（JSON等）で返却されているかの確認と修正。

---

## SPEC
1. `wave_dashboard.html` の `<head>` に Bootstrap 5 と DataTables の CDN を追加。
2. テーブルタグに DataTables 用の ID を付与し、JS で初期化。
3. 金額データが含まれる列に対し、日本円形式のフォーマット関数を適用。

---

## EXPECT RESULT
* `wave_dashboard.html` がモダンなデザインになり、動的なソート・検索が可能。  
* 金額が「¥1,234,567」のように表示されている。  
* 物理ファイルが直接書き換えられ、PRが生成されている。

---

## REVIEW CHECK
・関数重複  
・削除タスク確認  
・追加タスク確認  
・移動タスク確認  
・金額フォーマットの正確性

---

## NOTE
重要ルール
HTMLはシートを直接操作せず、必ず GAS API (`20_api_netshop.gs`) を介してデータを取得すること。

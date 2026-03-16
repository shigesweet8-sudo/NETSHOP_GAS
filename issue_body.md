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

NETSHOP_GAS の Webアーキテクチャ分離のため  
API関数 `api_listItems()` を WebApp モジュールから API モジュールへ移動する。

WebApp と API の責務を分離し  
NETSHOP_GAS Web化 Phase1 の基盤を構築する。

---

## CHANGE TYPE

削除  
追加  
移動  

---

## PROJECT

NETSHOP_GAS

---

## MODULE

API  
UI  

---

## TARGET FILE

10_webapp.gs  
20_api_netshop.gs  

---

## TASK

TASK1  
10_webapp.gs  
api_listItems 削除  

TASK2  
20_api_netshop.gs  
api_listItems 追加  

TASK3  
api_listItems API実装  
商品一覧取得ロジック実装  

---

## SPEC

API名  
api_listItems()

処理

スプレッドシート取得  
対象商品シート取得  
商品一覧データ取得  
配列として返却  

エラーが出ないように安全に処理すること。

---

## EXPECT RESULT

api_listItems は

20_api_netshop.gs のみに存在する。

APIとして商品一覧データを配列で返却できる。

---

## REVIEW CHECK

AIレビュー確認項目

・関数重複  
・削除タスク確認  
・追加タスク確認  
・移動タスク確認  

---

## NOTE

重要ルール

HTMLはシートを直接操作しない

HTML  
↓  
GAS API  
↓  
Spreadsheet

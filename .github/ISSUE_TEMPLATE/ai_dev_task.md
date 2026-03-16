# ALTANA AI FACTORY ISSUE

---

## MODE

DIRECT / PLAN

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

このIssueの目的

例

商品一覧取得APIを作成する

---

## CHANGE TYPE

追加  
修正  
削除  
移動  

※複数可

---

## PROJECT

例

NETSHOP_GAS  
ALTANA_GAS  

---

## MODULE

例

API  
UI  
DATABASE  

---

## TARGET FILE

変更対象ファイル

例

20_api_netshop.gs  
10_webapp.gs  

---

## TASK

TASK1

TASK2

TASK3

TASK4

例

TASK1  
10_webapp.gs  
api_listItems 削除  

TASK2  
20_api_netshop.gs  
api_listItems 追加  

---

## SPEC

実装仕様

例

API名  
api_listItems(filter)

処理  

管理シート取得  
商品一覧返却  

---

## EXPECT RESULT

実装後の状態

例

api_listItems は  
20_api_netshop.gs のみ存在  

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

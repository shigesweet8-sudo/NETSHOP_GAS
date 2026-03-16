# ALTANA AI開発工場 Issue

## MODE
DIRECT / PLAN

DIRECT  
単純タスク

PLAN  
AIがタスク分解

---

## GOAL
このIssueの目的

---

## CHANGE TYPE
追加
修正
削除
移動

---

## PROJECT
例
NETSHOP_GAS

---

## MODULE
例
API
UI
DATABASE

---

## TARGET FILE
例

20_api_netshop.gs  
10_webapp.gs

---

## TASK

TASK1

TASK2

TASK3

例

TASK1  
10_webapp.gs  
api_listItems 削除

TASK2  
20_api_netshop.gs  
api_listItems 追加

---

## SPEC

API仕様

例

api_listItems(filter)

管理シートを取得  
商品一覧を返す

---

## EXPECT RESULT

例

api_listItems は  
20_api_netshop.gs のみ存在

---

## REVIEW CHECK

関数重複  
削除タスク確認  
追加タスク確認

---

## NOTE

HTMLは直接Sheetを触らない

HTML  
↓  
GAS API  
↓  
Spreadsheet

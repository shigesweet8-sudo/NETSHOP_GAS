## MODE
DIRECT

---

## GOAL

api_listItems を  
20_api_netshop.gs に一本化する

---

## CHANGE TYPE

削除  
修正

---

## PROJECT

NETSHOP_GAS

---

## MODULE

API

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
api_listItems を正として維持確認  

---

## SPEC

api_listItems は  
API専用ファイルにのみ存在させる  

10_webapp.gs 側の  
重複定義を削除する  

---

## EXPECT RESULT

api_listItems は  

20_api_netshop.gs  
のみ存在  

---

## REVIEW CHECK

・関数重複  
・削除タスク確認  
・API呼び出し影響確認  

---

## NOTE

HTMLはシートを直接操作しない  

HTML  
↓  
GAS API  
↓  
Spreadsheet

# ALTANA AI FACTORY ISSUE

---

## MODE

DIRECT

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

`10_webapp.gs` に残っている不要な `api_listItems()` を削除し、
APIの重複を解消する。

---

## CHANGE TYPE

削除  

---

## PROJECT

NETSHOP_GAS

---

## MODULE

UI  

---

## TARGET FILE

10_webapp.gs  

---

## TASK

TASK1  
10_webapp.gs  
api_listItems 削除  

---

## SPEC

`20_api_netshop.gs` 側の `api_listItems()` は残す。  
今回の修正では `10_webapp.gs` にある重複した `api_listItems()` のみ削除する。  

他の関数・処理は変更しないこと。  
最小差分で対応すること。  

---

## EXPECT RESULT

`api_listItems()` は  
`20_api_netshop.gs` のみに存在する。  

`10_webapp.gs` からは削除されている。  

---

## REVIEW CHECK

AIレビュー確認項目

・関数重複  
・削除タスク確認  
・20_api_netshop.gs 側が維持されているか  
・不要な他変更が入っていないか  

---

## NOTE

重要ルール

HTMLはシートを直接操作しない

HTML  
↓  
GAS API  
↓  
Spreadsheet

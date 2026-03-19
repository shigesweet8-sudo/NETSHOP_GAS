# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

売上・利益などのダッシュボード集計情報を取得するAPIを実装し、Web画面で指標表示を可能にする

---

## CHANGE TYPE

追加

---

## PROJECT

NETSHOP_GAS

---

## MODULE

API

---

## TARGET FILE

20_api_netshop.gs

---

## TASK

TASK1
20_api_netshop.gs
getDashboardSummary(filter) を新規追加

TASK2
20_api_netshop.gs
listItems(filter) を利用して対象データ取得

TASK3
20_api_netshop.gs
総販売数・総売上・総手数料・総送料・総仕入・総利益を算出

TASK4
20_api_netshop.gs
利益率（profit / sales * 100）を算出

---

## SPEC

API名
getDashboardSummary(filter)

処理

1. listItems(filter) を呼び出しデータ取得
2. データが空の場合はすべて0で返却
3. 以下を算出

- totalCount（件数）
- totalSales（売上）
- totalFee（手数料）
- totalShipping（送料）
- totalCost（仕入）
- totalProfit（利益）
- profitRate（利益率）

4. 各値は数値として返却
5. profitRate は 0除算防止

---

## EXPECT RESULT

- getDashboardSummary は 20_api_netshop.gs のみ存在する
- 数値集計が正しく返る
- 空データでもエラーにならない
- filter による絞り込みが可能

---

## REVIEW CHECK

・関数重複なし  
・listItems を利用している  
・数値計算が正しい  
・0除算対策あり  

---

## NOTE

HTMLはシートを直接操作しない

HTML  
↓  
GAS API  
↓  
Spreadsheet

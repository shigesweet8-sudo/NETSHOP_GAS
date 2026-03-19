# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

商品データをCSV形式で出力するAPIを実装し、Web画面からCSVダウンロードを可能にする

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
exportCsv(filter) を新規追加

TASK2
20_api_netshop.gs
listItems(filter) を利用してデータ取得

TASK3
20_api_netshop.gs
オブジェクト配列をCSV文字列へ変換

TASK4
20_api_netshop.gs
BOM付きUTF-8形式で返却

---

## SPEC

API名
exportCsv(filter)

処理

1. listItems(filter) を呼び出しデータ取得
2. データが空の場合は空文字を返す
3. ヘッダー行を生成（オブジェクトキー）
4. 各行データをCSV形式に変換
5. カンマ区切り、改行区切りで文字列生成
6. 文字列先頭に BOM（\uFEFF）を付与
7. CSV文字列を返却

補足

・ダブルクォートで値を囲む  
・値内のダブルクォートはエスケープする  
・null / undefined は空文字扱い  

---

## EXPECT RESULT

- exportCsv は 20_api_netshop.gs のみ存在する
- CSV文字列が生成される
- 日本語文字化けしない
- フィルタ条件で絞り込み可能

---

## REVIEW CHECK

・関数重複なし  
・listItems を利用している  
・CSV変換処理がある  
・BOM付与されている  
・エスケープ処理がある  

---

## NOTE

HTMLはシートを直接操作しない

HTML  
↓  
GAS API  
↓  
Spreadsheet

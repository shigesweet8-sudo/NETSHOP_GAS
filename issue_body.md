## MODE
PLAN

## GOAL
listItems APIの返却形式（オブジェクト配列）にUIを対応させる

## CHANGE TYPE
修正

## PROJECT
NETSHOP_GAS

## MODULE
UI

## TARGET FILE
index.html

## TASK

TASK1
index.html
renderTable関数修正

TASK2
Object.keys を使ってヘッダー生成

TASK3
Object.values を使って行描画

## SPEC

listItems() はオブジェクト配列を返す

例
[{商品名:"A",価格:1000}]

renderTable は以下に変更

ヘッダー
Object.keys(items[0])

行
items.forEach(item => Object.values(item))

## EXPECT RESULT

オブジェクト配列でも正常に一覧表示される

## REVIEW CHECK

・旧2次元配列依存削除
・forEachエラー解消

## NOTE

HTMLは直接シート操作しない

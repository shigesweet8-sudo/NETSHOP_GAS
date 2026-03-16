## 開発目的

NETSHOP_GAS の統合売上データを  
WAVE Web UI から取得できるようにする。

最初の API として  
商品一覧取得 API を実装する。

WAVE構造

HTML UI
↓
GAS API
↓
Spreadsheet

この構造の最初の基礎API。

---

## 背景

NETSHOP_GAS は現在  
Spreadsheet入力ベースで運用されている。

次フェーズでは

Sheet入力
↓
Web入力

へ移行する。

そのため

HTML → GAS API → Sheet

の通信構造を作る必要がある。

その第一歩として  
商品一覧取得APIを作成する。

---

## 対象ファイル

新規作成



---

## 実装内容

GAS API

api_listItems()

を実装する。

処理

1  
CONFIG.SHEET_NAME のシート取得

2  
getDataRange() でデータ取得

3  
values を return

コード例


---

## 完了条件

以下が満たされること

- api_listItems() が存在する
- エラーなく実行できる
- values が返却される

---

## テスト方法

Apps Script console でを実行

配列データが返ればOK

---

## 補足

HTMLはまだ作らない

最初は

GAS API単体

のみ実装する

## 補足
必要に応じて追加説明


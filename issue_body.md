## 開発目的

api_listItems が現在

10_webapp.gs

に実装されているが、設計では

20_api_netshop.gs

に配置するAPIであるため、実装ファイルを整理する。

APIの責務を分離し、今後のWAVE API拡張に備える。

---

## 背景

WAVE-STEP01 api_listItems API作成の実装で  
AIが既存ファイル

10_webapp.gs

に api_listItems を追加した。

しかしNETSHOP_GASの設計では

Webエントリ
10_webapp.gs

API実装
20_api_netshop.gs

の構造で管理する。

このままでは

- API責務が混在
- 将来APIが増えたとき管理困難
- コード重複の可能性

があるため修正する。

---

## 対象ファイル

- 10_webapp.gs
- 20_api_netshop.gs

---

## 実装内容

1  
10_webapp.gs から

api_listItems()

を削除する

2  
20_api_netshop.gs に

api_listItems()

を実装する

3  
既存処理ロジックは変更せず  
実装場所のみ整理する

4  
APIロジックの重複を排除する

---

## 完了条件

- api_listItems() が  
  20_api_netshop.gs に存在する

- 10_webapp.gs に  
  api_listItems() が存在しない

- 既存機能に影響がない

- GASで api_listItems() 実行可能

---

## テスト方法

1  
Apps Scriptで

api_listItems()

を実行

2  
統合売上データシートのデータが  
配列として取得できること

3  
エラーが発生しないこと

---

## 補足

NETSHOP_GAS の設計構造

Webエントリ
10_webapp.gs

API群
20_api_netshop.gs

今後追加されるAPI

- api_createItem
- api_updateItem
- api_getDashboard

も同様に  
20_api_netshop.gs に実装する。

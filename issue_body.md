# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

商品一覧から選択した1件の詳細情報を取得するAPIを実装する

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
getItem(itemId) を新規追加

TASK2
20_api_netshop.gs
シート使用中範囲からヘッダー行とデータ行を分離し、管理IDで対象1件を特定する処理を実装

TASK3
20_api_netshop.gs
個人情報列を除外した詳細オブジェクトを返却する処理を実装

---

## SPEC

API名
getItem(itemId)

処理

1. 管理対象シートを取得
2. データ範囲を取得
3. ヘッダー行とデータ行を分離
4. 管理ID列を基準に itemId と一致する1件を検索
5. 以下の列は返却対象から除外する
　- 購入者名
　- 郵便番号
　- 都道府県
　- 住所2(地番)
　- 住所3(建物名)
　- 電話番号
6. ヘッダー名ベースのオブジェクトに変換して返却
7. 一致データが無い場合は null を返却

---

## EXPECT RESULT

- getItem は 20_api_netshop.gs のみ存在する
- 管理IDで1件取得できる
- 個人情報列は返却されない
- 一致しない場合は null を返す

---

## REVIEW CHECK

・関数重複なし
・getItem が新規追加されている
・管理ID検索になっている
・個人情報除外が実装されている
・一致なしで null 返却になっている

---

## NOTE

HTMLはシートを直接操作しない

HTML
↓
GAS API
↓
Spreadsheet

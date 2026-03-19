# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

登録済み商品の内容を更新するAPIを実装し、Web画面から商品情報を編集保存できる状態にする

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
updateItem(itemId, input) を新規追加

TASK2
20_api_netshop.gs
管理IDで対象行を特定し、入力データをヘッダー対応で既存行へ反映する処理を実装

TASK3
20_api_netshop.gs
更新後の1件データを取得し、個人情報列を除外したオブジェクトを返却する処理を実装

---

## SPEC

API名
updateItem(itemId, input)

処理

1. 管理対象シートを取得
2. データ範囲を取得
3. ヘッダー行とデータ行を分離
4. 管理ID列を基準に itemId と一致する対象行を検索
5. 対象行が存在しない場合は null を返却
6. input に含まれる項目のみ既存値を更新する
7. 管理ID は更新しない
8. 個人情報列も保存対象には含めてよいが、返却対象からは除外する
9. 更新後の対象行を再取得する
10. getItem(itemId) を用いて個人情報除外済みオブジェクトを返却する

補足
- 部分更新とする
- 未指定項目は既存値を維持する
- 管理ID列は変更禁止

返却対象から除外する列
- 購入者名
- 郵便番号
- 都道府県
- 住所2(地番)
- 住所3(建物名)
- 電話番号

---

## EXPECT RESULT

- updateItem は 20_api_netshop.gs のみ存在する
- 管理IDで対象1件を更新できる
- input に含まれる項目のみ更新される
- 管理IDは変更されない
- 更新後データをオブジェクトで返す
- 個人情報列は返却されない
- 一致しない場合は null を返す

---

## REVIEW CHECK

・関数重複なし
・updateItem が新規追加されている
・管理ID検索になっている
・部分更新になっている
・管理IDを更新していない
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

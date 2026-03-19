# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

商品のステータスを更新するAPIを実装し、Web画面から進行状態を変更できる状態にする

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
updateItemStatus(itemId, status, memo) を新規追加

TASK2
20_api_netshop.gs
管理IDで対象行を特定し、ステータス列を更新する処理を実装

TASK3
20_api_netshop.gs
ステータス更新後の必要日付反映と更新後データ返却処理を実装

---

## SPEC

API名
updateItemStatus(itemId, status, memo)

処理

1. 管理対象シートを取得
2. データ範囲を取得
3. ヘッダー行とデータ行を分離
4. 管理ID列を基準に itemId と一致する対象行を検索
5. 対象行が存在しない場合は null を返却
6. ステータス列を status で更新する
7. DATE 列には更新日時を設定する
8. status が 商品登録 で、商品登録日列が空の場合のみ 商品登録日 を設定する
9. memo が指定されている場合はメモ列を更新する
10. 更新後の1件データを getItem(itemId) で取得して返却する

補足
- 管理IDは変更しない
- 個人情報列は返却対象から除外する
- DATE はステータス更新時に毎回更新する
- 商品登録日は初回のみ設定する

返却対象から除外する列
- 購入者名
- 郵便番号
- 都道府県
- 住所2(地番)
- 住所3(建物名)
- 電話番号

---

## EXPECT RESULT

- updateItemStatus は 20_api_netshop.gs のみ存在する
- 管理IDで対象1件のステータス更新ができる
- DATE が更新される
- 商品登録日は初回のみ設定される
- memo 指定時はメモが更新される
- 更新後データをオブジェクトで返す
- 一致しない場合は null を返す

---

## REVIEW CHECK

・関数重複なし
・updateItemStatus が新規追加されている
・管理ID検索になっている
・ステータス列更新になっている
・DATE 更新が入っている
・商品登録日が初回のみ設定になっている
・memo 更新が入っている
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

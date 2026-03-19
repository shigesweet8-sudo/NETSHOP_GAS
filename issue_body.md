# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

商品を新規登録するAPIを実装し、Web画面から新規商品を保存できる状態にする

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
createItem(input) を新規追加

TASK2
20_api_netshop.gs
入力データから登録用1件データを生成し、管理ID採番を行う処理を実装

TASK3
20_api_netshop.gs
シートへ1件追加し、登録後データを返却する処理を実装

---

## SPEC

API名
createItem(input)

処理

1. 管理対象シートを取得
2. 入力オブジェクト input を受け取る
3. 管理IDを採番する
4. 新規行データを生成する
5. 初期ステータスが未指定の場合は 商品登録 を設定する
6. 必要項目をヘッダーに合わせて1行データへ変換する
7. シート末尾に1件追加する
8. 登録後の1件データを取得する
9. 個人情報列を除外したオブジェクトを返却する

補足
- 返却対象から除外する列
  - 購入者名
  - 郵便番号
  - 都道府県
  - 住所2(地番)
  - 住所3(建物名)
  - 電話番号

---

## EXPECT RESULT

- createItem は 20_api_netshop.gs のみ存在する
- input を受けて新規登録できる
- 管理IDが採番される
- ステータス未指定時は 商品登録 で保存される
- 登録後データをオブジェクトで返す
- 個人情報列は返却されない

---

## REVIEW CHECK

・関数重複なし
・createItem が新規追加されている
・管理ID採番が入っている
・新規1件追加になっている
・ステータス未指定時に 商品登録 が入る
・個人情報除外が実装されている

---

## NOTE

HTMLはシートを直接操作しない

HTML
↓
GAS API
↓
Spreadsheet

# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

商品の金額項目から粗利を再計算するAPIを実装し、Web画面から計算結果を取得できる状態にする

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
recalculateItemProfit(itemId) を新規追加

TASK2
20_api_netshop.gs
対象データの金額項目を取得し、粗利計算ロジックを実装

TASK3
20_api_netshop.gs
計算結果を更新し、更新後データを返却する処理を実装

---

## SPEC

API名
recalculateItemProfit(itemId)

処理

1. 管理対象シートを取得
2. データ範囲を取得
3. ヘッダー行とデータ行を分離
4. 管理ID列を基準に itemId と一致する対象行を検索
5. 対象行が存在しない場合は null を返却
6. 以下の値を取得する
　- 仕入れ値
　- 決済金額
　- サイト利用料
　- 配送料
7. 粗利を計算する  
　粗利 = 決済金額 - サイト利用料 - 配送料 - 仕入れ値
8. 粗利列に計算結果を書き込む
9. 更新後の1件データを getItem(itemId) で取得して返却する

補足
- 計算対象の値が未入力の場合は 0 として扱う
- 管理IDは変更しない
- 個人情報列は返却対象から除外する

返却対象から除外する列
- 購入者名
- 郵便番号
- 都道府県
- 住所2(地番)
- 住所3(建物名)
- 電話番号

---

## EXPECT RESULT

- recalculateItemProfit は 20_api_netshop.gs のみ存在する
- 管理IDで対象1件の粗利再計算ができる
- 粗利が正しく計算される
- 計算結果がシートに反映される
- 更新後データをオブジェクトで返す
- 一致しない場合は null を返す

---

## REVIEW CHECK

・関数重複なし
・recalculateItemProfit が新規追加されている
・管理ID検索になっている
・粗利計算式が正しい
・シートへ反映されている
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

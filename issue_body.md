# ALTANA AI FACTORY ISSUE

---

## MODE

PLAN

---

## GOAL

郵便番号から住所情報を取得するAPIを実装し、Web画面で住所自動入力を可能にする

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
lookupAddressByZip(zip) を新規追加

TASK2
20_api_netshop.gs
郵便番号を正規化し、外部APIへ問い合わせる処理を実装

TASK3
20_api_netshop.gs
取得した住所情報を整形して返却する処理を実装

---

## SPEC

API名
lookupAddressByZip(zip)

処理

1. 引数 zip を受け取る
2. ハイフンや空白を除去し、郵便番号を正規化する
3. 郵便番号が7桁でない場合は null を返却
4. 以下の外部APIにリクエストする  
　https://zipcloud.ibsnet.co.jp/api/search?zipcode=郵便番号
5. レスポンスを解析する
6. 結果が存在しない場合は null を返却
7. 以下の形式で返却する  
　- prefecture（都道府県）  
　- city（市区町村）  
　- address（町域）  
8. 取得失敗時は null を返却する

補足
- 外部APIエラー時も null を返却する
- GASの UrlFetchApp を使用する

---

## EXPECT RESULT

- lookupAddressByZip は 20_api_netshop.gs のみ存在する
- 郵便番号から住所情報が取得できる
- 不正な郵便番号は null を返す
- APIエラー時も null を返す
- prefecture / city / address を返却する

---

## REVIEW CHECK

・関数重複なし
・lookupAddressByZip が新規追加されている
・郵便番号正規化が入っている
・外部API呼び出しがある
・レスポンス整形がされている
・エラー時 null 返却になっている

---

## NOTE

HTMLはシートを直接操作しない

HTML
↓
GAS API
↓
Spreadsheet

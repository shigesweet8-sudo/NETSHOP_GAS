1. 20_api_netshop.gs に lookupAddressByZip(zip) 関数を新規追加する。
2. 引数 zip を正規化する処理を実装し、ハイフンや空白を除去する。
3. 郵便番号が7桁でない場合に null を返す処理を実装する。
4. 外部API (https://zipcloud.ibsnet.co.jp/api/search?zipcode=郵便番号) へのリクエスト処理を実装する。
5. レスポンスを解析し、結果が存在しない場合に null を返す処理を実装する。
6. 取得した住所情報を、都道府県、 市区町村、 町域の形式で整形して返却する処理を実装する。
7. API エラー時に null を返す処理を実装する。

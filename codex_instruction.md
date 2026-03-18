変更ファイル名: index.html

差分要約: 入力要素に id を付与し、登録処理で入力値を取得して api_createItem に渡し、一覧を更新する処理を実装

diff --git a/index.html b/index.html
index 1234567..89abcdef 100644
--- a/index.html
+++ b/index.html
@@ -1,6 +1,9 @@
 <input type="text" id="productName" placeholder="商品名">
 <input type="number" id="purchasePrice" placeholder="仕入金額">
 <input type="number" id="sellingPrice" placeholder="販売金額">
 <input type="number" id="quantity" placeholder="数量">
+<button id="registerButton">登録</button>
+
 <script>
     document.getElementById('registerButton').addEventListener('click', function() {
         var payload = {
             productName: document.getElementById('productName').value,
             purchasePrice: document.getElementById('purchasePrice').value,
             sellingPrice: document.getElementById('sellingPrice').value,
             quantity: document.getElementById('quantity').value
         };
         google.script.run.withSuccessHandler(api_listItems).api_createItem(payload);
     });
 </script>

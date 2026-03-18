変更ファイル名: index.html

差分要約: 更新ボタンを追加し、ボタンクリック時に固定値のidとpayloadを使ってapi_updateItemを呼び出す更新処理関数を実装。

```diff
--- index.html
+++ index.html
@@ -1,5 +1,20 @@
 <!DOCTYPE html>
 <html>
 <head>
     <title>NetShop</title>
 </head>
 <body>
     <h1>商品一覧</h1>
 
+    <!-- 更新ボタンの追加 -->
+    <button id="updateButton">更新</button>
+
+    <script>
+        // 更新処理関数の追加
+        function updateItem() {
+            const id = '固定値のid'; // 固定値のid
+            const payload = { key: '固定値のpayload' }; // 固定値のpayload
+            google.script.run.api_updateItem(id, payload); // api_updateItemの呼び出し
+        }
+
+        // ボタンクリック時に更新処理関数を呼び出す
+        document.getElementById('updateButton').addEventListener('click', updateItem);
+    </script>
+
 </body>
 </html>
```

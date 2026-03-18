変更ファイル名: index.html  
差分要約: 登録ボタンを追加し、ボタンクリック時に api_createItem を呼び出す処理を追加。payloadは固定値で構築。  

```diff
--- index.html
+++ index.html
@@ -1,5 +1,12 @@
 <!DOCTYPE html>
 <html lang="ja">
 <head>
     <meta charset="UTF-8">
     <title>Netshop</title>
 </head>
 <body>
+    <button id="registerButton">登録</button>
+
+    <script>
+        function registerItem() {
+            const payload = { key: "固定値" }; // 固定値のpayloadを構築
+            google.script.run.api_createItem(payload); // api_createItemを呼び出す
+        }
+        document.getElementById('registerButton').addEventListener('click', registerItem); // ボタンクリック時に関数を呼び出す
+    </script>
 </body>
 </html>
```

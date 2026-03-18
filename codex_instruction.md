変更ファイル名: index.html

差分要約:
1. 登録ボタンを追加
2. 登録処理関数を追加し、ボタンクリック時に api_createItem を呼び出すように実装
3. payloadを固定値で構築

```diff
diff --git a/index.html b/index.html
index abcdef1..abcdef2 100644
--- a/index.html
+++ b/index.html
@@ -1,6 +1,10 @@
 <!DOCTYPE html>
 <html lang="ja">
 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Netshop</title>
 </head>
 <body>
+    <button id="register-button">登録</button>
+
+    <script>
+        document.getElementById("register-button").onclick = function() {
+            const payload = { fixedValue: "sample" }; // 固定値のpayloadを構築
+            google.script.run.api_createItem(payload); // api_createItemを呼び出す
+        };
+    </script>
 </body>
 </html>
```

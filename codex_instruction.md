```diff
diff --git a/index.html b/index.html
index abcdef1..1234567 100644
--- a/index.html
+++ b/index.html
@@ -1,0 +1,15 @@
+<!DOCTYPE html>
+<html>
+<head>
+    <title>Items List</title>
+    <script>
+        function displayItems() {
+            google.script.run.withSuccessHandler(renderItems).api_listItems();
+        }
+
+        function renderItems(rows) {
+            const table = document.createElement('table');
+            const header = rows[0];
+            const data = rows.slice(1);
+
+            // Create header row
+            const headerRow = document.createElement('tr');
+            header.forEach(cell => {
+                const th = document.createElement('th');
+                th.textContent = cell;
+                headerRow.appendChild(th);
+            });
+            table.appendChild(headerRow);
+
+            // Create data rows
+            data.forEach(row => {
+                const dataRow = document.createElement('tr');
+                row.forEach(cell => {
+                    const td = document.createElement('td');
+                    td.textContent = cell;
+                    dataRow.appendChild(td);
+                });
+                table.appendChild(dataRow);
+            });
+
+            document.body.appendChild(table);
+        }
+    </script>
+</head>
+<body onload="displayItems()">
+</body>
+</html>
```

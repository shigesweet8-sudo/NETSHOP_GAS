1. Add Bootstrap 5 and DataTables.js CDN links in the `<head>` section of `wave_dashboard.html`.
2. Add an ID for the table in `wave_dashboard.html`, and write a JavaScript block to initialize DataTables on that ID.
3. Modify the code within the table generation logic to format the amount column with `.toLocaleString()` to show currency format with a yen symbol.
4. Check the API logic in `20_api_netshop.gs` to ensure it outputs data in JSON format compatible with DataTables, making necessary adjustments as needed.

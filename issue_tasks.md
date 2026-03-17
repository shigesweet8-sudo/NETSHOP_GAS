1. Update `wave_dashboard.html` to include the Bootstrap 5 and DataTables.js CDNs in the `<head>`.
2. Refresh the table design by assigning a DataTables ID and initializing it with JavaScript to enable sorting and search functionalities.
3. Implement the currency formatting for the amount column using `.toLocaleString()` to display values in the format of "¥1,234,567".
4. Verify and modify the API response in `20_api_netshop.gs` to ensure it returns data in a format suitable for DataTables (e.g., JSON).

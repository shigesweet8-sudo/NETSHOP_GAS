1. Implement `doGet(e)` in `10_webapp.gs` to render `wave_dashboard.html` with `HtmlService` and set X-Frame-Options to `ALLOWALL`.
2. Create `wave_dashboard.html` with Bootstrap 5, include summary cards for "総売上" and "総利益", and build a table for product listings.
3. Implement communication logic using `google.script.run`, calling `api_listItems()` and `api_getDashboardData()` on page load.
4. Implement `api_getDashboardData()` in `20_api_netshop.gs` to fetch values from the "ダッシュボード" sheet and return them as a JSON object.

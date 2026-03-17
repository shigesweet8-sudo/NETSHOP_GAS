1. Modify `20_api_netshop.gs` to add a debug log before retrieving the sheet by name.
2. Implement error handling that returns `null` when the sheet is not found.
3. Validate `CONFIG.SHEET_NAME` in `01_config.gs` to ensure it matches the actual tab name, including trimming spaces.
4. Explore implementing a smarter logic for retrieving the sheet, either by ID or by using a partial match across all sheets.
5. Update the front-end to display a user-friendly error message when the sheet name does not match.

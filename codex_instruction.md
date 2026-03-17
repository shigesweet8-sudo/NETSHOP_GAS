1. In `20_api_netshop.gs`, add `console.log('Target Sheet Name:', CONFIG.SHEET_NAME);` before the line that retrieves the sheet.
2. Add error handling logic that checks if the returned sheet is `null` and displays a relevant error message in the browser.
3. In `01_config.gs`, ensure `CONFIG.SHEET_NAME` is accurate and implement `trim()` to remove any leading or trailing spaces.
4. Investigate options to allow for sheet retrieval by ID or by implementing a search function that checks all sheet names for partial matches.
5. Adjust the front-end code to catch the specific error and inform the user that "シート名が違います".

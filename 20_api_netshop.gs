/**
 * 商品一覧をシートから取得して返却する。
 * @returns {Array<Array<*>>}
 */
function api_listItems() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Active spreadsheet not found.');

    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    var columnCount = CONFIG.HEADERS && CONFIG.HEADERS.length
      ? CONFIG.HEADERS.length
      : sheet.getLastColumn();
    if (columnCount <= 0) return [];

    var rows = sheet.getRange(2, 1, lastRow - 1, columnCount).getValues();
    return rows.filter(function(row) {
      return row.some(function(cell) {
        return cell !== '' && cell !== null;
      });
    });
  } catch (error) {
    Logger.log('api_listItems error: ' + (error && error.stack ? error.stack : error));
    return [];
  }
}

// ALTANA FACTORY TEST 3
/**
 * 商品一覧をシートから取得して返却する。
 * @returns {Array<Array<*>>}
 */
function api_listItems() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return [];

    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow === 0 || lastColumn === 0) return [];

    return sheet.getDataRange().getValues();
  } catch (error) {
    Logger.log('api_listItems error: ' + error);
    return [];
  }
}

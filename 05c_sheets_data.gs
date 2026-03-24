function getManagementDataLastRow_(sheet) {
  return sheet.getLastRow();
}

function getManagementRequiredWarningColumns_(rowValues) {
  var col = CONFIG.COLS;
  var requiredColumns = [
    col.ID,
    col.STAFF,
    col.PRODUCT_REG_DATE,
    col.SHOP,
    col.ITEM_NAME,
    col.STORAGE,
    col.QTY
  ];

  return requiredColumns.filter(function(column) {
    return isManagementBlankValue_(rowValues[column - 1]);
  });
}

function isManagementBlankValue_(value) {
  if (value === null || value === '') return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * 管理シートに1行追加する
 * @param {Object} record - {date, shop, itemName, priceFinal, fee, shipping, cost, status, memo, orderId, qty}
 * @returns {number} 書き込んだ行番号
 */
function appendManagementRow_(record) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('「' + CONFIG.SHEET_NAME + '」シートが見つかりません');

  var col     = CONFIG.COLS;
  var nextRow = Math.max(sheet.getLastRow() + 1, 2);
  var id      = generateId_(record.shop || record.platform || '');

  var salePrice  = parseFloat(record.priceFinal || record.salePrice) || 0;
  var fee        = parseFloat(record.fee)        || 0;
  var shipping   = parseFloat(record.shipping)   || 0;
  var cost       = parseFloat(record.cost)       || 0;
  var profit     = salePrice - fee - shipping - cost;
  var profitRate = salePrice > 0 ? profit / salePrice : 0;

  var rowData = new Array(CONFIG.HEADERS.length).fill('');

  rowData[col.IMPORTED_AT - 1] = new Date();
  rowData[col.ID          - 1] = id;
  rowData[col.DATE        - 1] = record.date     || new Date();
  rowData[col.STATUS      - 1] = record.status   || CONFIG.STATUS.LISTING;
  rowData[col.SHOP        - 1] = record.shop || record.platform || '';
  if (col.ORDER_ID !== col.ID) {
    rowData[col.ORDER_ID  - 1] = record.orderId  || '';
  }
  rowData[col.ITEM_NAME   - 1] = record.itemName || '';
  rowData[col.QTY         - 1] = record.qty      || 1;
  rowData[col.COST        - 1] = cost;
  rowData[col.PRICE_FINAL - 1] = salePrice;
  rowData[col.FEE         - 1] = fee;
  rowData[col.SHIPPING    - 1] = shipping;
  rowData[col.PROFIT      - 1] = profit;
  rowData[col.MEMO        - 1] = record.memo || record.note || '';

  sheet.getRange(nextRow, 1, 1, CONFIG.HEADERS.length).setValues([rowData]);
  applyManagementRowStyle_(sheet, nextRow);

  return nextRow;
}

// ==================== シート取得ユーティリティ ====================

/**
 * シートを名前で取得、なければ作成する
 * @param {string} name
 * @returns {Sheet}
 */
function getOrCreateSheet_(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

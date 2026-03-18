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

/**
 * 商品を1件追加する。
 * @param {Object} payload
 * @returns {{ok: boolean, id: string, status: string, row: number}|{ok: boolean, error: string}}
 */
function api_createItem(payload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Spreadsheet not found');

    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);

    var col = CONFIG.COLS;
    var data = payload || {};
    var now = new Date();
    var itemId = 'ITEM-' + now.getTime();
    var initialStatus = data.status || CONFIG.STATUS.LISTING;

    var rowData = new Array(CONFIG.HEADERS.length).fill('');
    rowData[col.STATUS - 1] = initialStatus;
    rowData[col.ID - 1] = itemId;
    rowData[col.STAFF - 1] = data.staff || '';
    rowData[col.DATE - 1] = data.date || now;
    rowData[col.PRODUCT_REG_DATE - 1] = data.productRegDate || now;
    rowData[col.SHOP - 1] = data.shop || '';
    rowData[col.ITEM_NAME - 1] = data.itemName || '';
    rowData[col.COST - 1] = data.cost || '';
    rowData[col.STORAGE - 1] = data.storage || '';
    rowData[col.QTY - 1] = data.qty || 1;
    rowData[col.LIST_PRICE - 1] = data.listPrice || '';
    rowData[col.NEGOTIATED_PRICE - 1] = data.negotiatedPrice || '';
    rowData[col.PRICE_FINAL - 1] = data.priceFinal || '';
    rowData[col.FEE - 1] = data.fee || '';
    rowData[col.SHIPPING - 1] = data.shipping || '';
    rowData[col.SHIP_FROM - 1] = data.shipFrom || '';
    rowData[col.MEMO - 1] = data.memo || '';
    rowData[col.CUSTOMER - 1] = data.customer || '';
    rowData[col.CARRIER - 1] = data.carrier || '';
    rowData[col.TRACKING - 1] = data.tracking || '';
    rowData[col.ZIP - 1] = data.zip || '';
    rowData[col.PREF - 1] = data.pref || '';
    rowData[col.ADDR2 - 1] = data.addr2 || '';
    rowData[col.ADDR3 - 1] = data.addr3 || '';
    rowData[col.PHONE - 1] = data.phone || '';

    sheet.appendRow(rowData);

    return {
      ok: true,
      id: itemId,
      status: initialStatus,
      row: sheet.getLastRow()
    };
  } catch (error) {
    Logger.log('api_createItem error: ' + error);
    return {
      ok: false,
      error: String(error)
    };
  }
}

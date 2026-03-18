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

/**
 * 指定IDの商品を更新する。
 * @param {string} id
 * @param {Object} payload
 * @returns {{ok: boolean, id: string, row: number, updatedFields: Array<string>}|{ok: boolean, error: string}}
 */
function api_updateItem(id, payload) {
  try {
    if (!id) throw new Error('id is required');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Spreadsheet not found');

    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);

    var col = CONFIG.COLS;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) throw new Error('No data rows found');

    var idValues = sheet.getRange(2, col.ID, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var i = 0; i < idValues.length; i++) {
      if (String(idValues[i][0]) === String(id)) {
        targetRow = i + 2;
        break;
      }
    }
    if (targetRow === -1) throw new Error('ID not found: ' + id);

    var data = payload || {};
    var updatableCols = {
      status: col.STATUS,
      staff: col.STAFF,
      date: col.DATE,
      productRegDate: col.PRODUCT_REG_DATE,
      shop: col.SHOP,
      itemName: col.ITEM_NAME,
      cost: col.COST,
      storage: col.STORAGE,
      qty: col.QTY,
      listPrice: col.LIST_PRICE,
      negotiatedPrice: col.NEGOTIATED_PRICE,
      priceFinal: col.PRICE_FINAL,
      fee: col.FEE,
      shipping: col.SHIPPING,
      shipFrom: col.SHIP_FROM,
      memo: col.MEMO,
      customer: col.CUSTOMER,
      carrier: col.CARRIER,
      tracking: col.TRACKING,
      zip: col.ZIP,
      pref: col.PREF,
      addr2: col.ADDR2,
      addr3: col.ADDR3,
      phone: col.PHONE
    };

    var rowValues = sheet.getRange(targetRow, 1, 1, CONFIG.HEADERS.length).getValues()[0];
    var updatedFields = [];

    Object.keys(updatableCols).forEach(function(key) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        rowValues[updatableCols[key] - 1] = data[key];
        updatedFields.push(key);
      }
    });

    if (updatedFields.length === 0) throw new Error('No updatable fields in payload');

    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);

    return {
      ok: true,
      id: String(id),
      row: targetRow,
      updatedFields: updatedFields
    };
  } catch (error) {
    Logger.log('api_updateItem error: ' + error);
    return {
      ok: false,
      error: String(error)
    };
  }
}

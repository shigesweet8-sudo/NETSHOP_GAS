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

var ITEM_FIELD_TO_HEADER = Object.freeze({
  status: 'ステータス',
  id: '管理ID',
  staff: '出品担当者',
  date: '日にち',
  productRegDate: '商品登録日',
  shop: 'ショップ',
  itemName: '商品名',
  cost: '仕入れ値',
  storage: '保管場所',
  qty: '個数',
  listPrice: '出品金額',
  negotiatedPrice: '交渉金額',
  priceFinal: '決済金額',
  fee: 'サイト利用料',
  shipping: '配送料',
  shipFrom: '配送元',
  profit: '粗利(原価引)',
  memo: '備考',
  customer: '購入者名',
  carrier: '配送業者',
  tracking: '追跡番号',
  zip: '郵便番号',
  pref: '都道府県',
  addr2: '住所2(地番)',
  addr3: '住所3(建物名)',
  phone: '電話番号'
});

var PERSONAL_INFO_HEADERS = Object.freeze([
  '購入者名',
  '郵便番号',
  '都道府県',
  '住所2(地番)',
  '住所3(建物名)',
  '電話番号'
]);

/**
 * 指定IDの商品を取得する（個人情報列は除外）。
 * @param {string} itemId
 * @returns {Object|null}
 */
function getItem(itemId) {
  if (!itemId) return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var dataRows = values.slice(1);
  var idColIndex = headers.indexOf(ITEM_FIELD_TO_HEADER.id);
  if (idColIndex === -1) return null;

  var targetRow = null;
  for (var i = 0; i < dataRows.length; i++) {
    if (String(dataRows[i][idColIndex]) === String(itemId)) {
      targetRow = dataRows[i];
      break;
    }
  }
  if (!targetRow) return null;

  var item = {};
  Object.keys(ITEM_FIELD_TO_HEADER).forEach(function(field) {
    var header = ITEM_FIELD_TO_HEADER[field];
    if (PERSONAL_INFO_HEADERS.indexOf(header) !== -1) return;

    var index = headers.indexOf(header);
    if (index === -1) return;
    item[field] = targetRow[index];
  });

  return item;
}

/**
 * 指定IDの商品を部分更新し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @param {Object} input
 * @returns {Object|null}
 */
function updateItem(itemId, input) {
  if (!itemId) return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var dataRows = values.slice(1);
  var idColIndex = headers.indexOf(ITEM_FIELD_TO_HEADER.id);
  if (idColIndex === -1) return null;

  var targetIndex = -1;
  for (var i = 0; i < dataRows.length; i++) {
    if (String(dataRows[i][idColIndex]) === String(itemId)) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return null;

  var rowValues = dataRows[targetIndex].slice();
  var payload = input || {};
  var hasChanges = false;

  Object.keys(payload).forEach(function(field) {
    if (field === 'id') return;
    var header = ITEM_FIELD_TO_HEADER[field];
    if (!header) return;

    var colIndex = headers.indexOf(header);
    if (colIndex === -1) return;

    rowValues[colIndex] = payload[field];
    hasChanges = true;
  });

  if (hasChanges) {
    var sheetRow = targetIndex + 2;
    sheet.getRange(sheetRow, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return getItem(itemId);
}

/**
 * 指定IDの商品ステータスを更新し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @param {string} status
 * @param {string} memo
 * @returns {Object|null}
 */
function updateItemStatus(itemId, status, memo) {
  if (!itemId) return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var dataRows = values.slice(1);

  var idColIndex = headers.indexOf(ITEM_FIELD_TO_HEADER.id);
  if (idColIndex === -1) return null;

  var targetIndex = -1;
  for (var i = 0; i < dataRows.length; i++) {
    if (String(dataRows[i][idColIndex]) === String(itemId)) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return null;

  var rowValues = dataRows[targetIndex].slice();
  var now = new Date();
  var col = CONFIG.COLS;

  rowValues[col.STATUS - 1] = status;
  rowValues[col.DATE - 1] = now;

  if (status === CONFIG.STATUS.LISTING && !rowValues[col.PRODUCT_REG_DATE - 1]) {
    rowValues[col.PRODUCT_REG_DATE - 1] = now;
  }

  if (arguments.length >= 3) {
    rowValues[col.MEMO - 1] = memo;
  }

  var sheetRow = targetIndex + 2;
  sheet.getRange(sheetRow, 1, 1, rowValues.length).setValues([rowValues]);

  return getItem(itemId);
}

/**
 * 指定IDの商品粗利を再計算し、更新後データ（個人情報除外）を返却する。
 * 粗利 = 決済金額 - サイト利用料 - 配送料 - 仕入れ値
 * @param {string} itemId
 * @returns {Object|null}
 */
function recalculateItemProfit(itemId) {
  if (!itemId) return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  var headers = values[0];
  var dataRows = values.slice(1);
  var idColIndex = headers.indexOf(ITEM_FIELD_TO_HEADER.id);
  if (idColIndex === -1) return null;

  var targetIndex = -1;
  for (var i = 0; i < dataRows.length; i++) {
    if (String(dataRows[i][idColIndex]) === String(itemId)) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return null;

  var rowValues = dataRows[targetIndex].slice();
  var col = CONFIG.COLS;

  var cost = parseFloat(rowValues[col.COST - 1]) || 0;
  var sale = parseFloat(rowValues[col.PRICE_FINAL - 1]) || 0;
  var fee = parseFloat(rowValues[col.FEE - 1]) || 0;
  var shipping = parseFloat(rowValues[col.SHIPPING - 1]) || 0;
  var profit = sale - fee - shipping - cost;

  rowValues[col.PROFIT - 1] = profit;
  var sheetRow = targetIndex + 2;
  sheet.getRange(sheetRow, 1, 1, rowValues.length).setValues([rowValues]);

  return getItem(itemId);
}

/**
 * 指定IDの商品を更新する。
 * @param {string} id
 * @param {Object} payload
 * @returns {{ok: boolean, item: Object}|{ok: boolean, error: string}}
 */
function api_updateItem(id, payload) {
  try {
    var updatedItem = updateItem(id, payload);
    if (!updatedItem) throw new Error('ID not found: ' + id);

    return {
      ok: true,
      item: updatedItem
    };
  } catch (error) {
    Logger.log('api_updateItem error: ' + error);
    return {
      ok: false,
      error: String(error)
    };
  }
}

/**
 * 商品一覧をオブジェクト配列として返す。
 * @param {Object=} filter
 * @returns {Array<Object>}
 */
function listItems(filter) {
  var values = api_listItems();
  if (!values || values.length < 2) return [];

  var headers = values[0].map(function(header) {
    return String(header);
  });
  var rows = values.slice(1);

  var items = rows.map(function(row) {
    var item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  });

  if (!filter || typeof filter !== 'object') return items;

  var activeKeys = Object.keys(filter).filter(function(key) {
    return filter[key] !== null && filter[key] !== undefined && filter[key] !== '';
  });
  if (activeKeys.length === 0) return items;

  return items.filter(function(item) {
    return activeKeys.every(function(key) {
      var expected = filter[key];
      var actual = item[key];

      if (Array.isArray(expected)) {
        return expected.map(String).indexOf(String(actual)) !== -1;
      }
      return String(actual) === String(expected);
    });
  });
}

/**
 * ダッシュボード向け集計値を返す。
 * @param {Object=} filter
 * @returns {{
 *   totalCount: number,
 *   totalSales: number,
 *   totalFee: number,
 *   totalShipping: number,
 *   totalCost: number,
 *   totalProfit: number,
 *   profitRate: number
 * }}
 */
function getDashboardSummary(filter) {
  var emptySummary = {
    totalCount: 0,
    totalSales: 0,
    totalFee: 0,
    totalShipping: 0,
    totalCost: 0,
    totalProfit: 0,
    profitRate: 0
  };

  function toNumber(value) {
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    if (value === null || value === undefined || value === '') return 0;

    var normalized = String(value)
      .replace(/[,\s]/g, '')
      .replace(/[￥¥]/g, '')
      .replace(/，/g, '');
    var num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  try {
    var items = listItems(filter);
    if (!items || items.length === 0) return emptySummary;

    var salesKey = CONFIG.HEADERS[CONFIG.COLS.PRICE_FINAL - 1];
    var feeKey = CONFIG.HEADERS[CONFIG.COLS.FEE - 1];
    var shippingKey = CONFIG.HEADERS[CONFIG.COLS.SHIPPING - 1];
    var costKey = CONFIG.HEADERS[CONFIG.COLS.COST - 1];

    var summary = {
      totalCount: items.length,
      totalSales: 0,
      totalFee: 0,
      totalShipping: 0,
      totalCost: 0,
      totalProfit: 0,
      profitRate: 0
    };

    items.forEach(function(item) {
      var sale = toNumber(item[salesKey]);
      var fee = toNumber(item[feeKey]);
      var shipping = toNumber(item[shippingKey]);
      var cost = toNumber(item[costKey]);

      summary.totalSales += sale;
      summary.totalFee += fee;
      summary.totalShipping += shipping;
      summary.totalCost += cost;
      summary.totalProfit += sale - fee - shipping - cost;
    });

    summary.profitRate = summary.totalSales !== 0
      ? (summary.totalProfit / summary.totalSales) * 100
      : 0;

    return summary;
  } catch (error) {
    Logger.log('getDashboardSummary error: ' + error);
    return emptySummary;
  }
}

/**
 * 商品一覧をCSV文字列として返す（BOM付きUTF-8）。
 * @param {Object=} filter
 * @returns {string}
 */
function exportCsv(filter) {
  var items = listItems(filter);
  if (!items || items.length === 0) return '';

  var headers = Object.keys(items[0]);

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    var text = String(value).replace(/"/g, '""');
    return '"' + text + '"';
  }

  var lines = [];
  lines.push(headers.map(escapeCsvCell).join(','));

  items.forEach(function(item) {
    var line = headers.map(function(header) {
      return escapeCsvCell(item[header]);
    }).join(',');
    lines.push(line);
  });

  return '\uFEFF' + lines.join('\r\n');
}

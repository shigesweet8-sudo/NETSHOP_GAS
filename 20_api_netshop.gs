/**
 * NETSHOP API helpers and endpoints.
 */
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

function getManagementSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
  return ss.getSheetByName(CONFIG.SHEET_NAME);
}

function getSheetSnapshot_() {
  var sheet = getManagementSheet_();
  if (!sheet) return null;

  var values = sheet.getDataRange().getValues();
  if (!values.length) {
    return {
      sheet: sheet,
      headers: CONFIG.HEADERS.slice(),
      rows: []
    };
  }

  return {
    sheet: sheet,
    headers: values[0].map(function(header) {
      return String(header || '').trim();
    }),
    rows: values.slice(1)
  };
}

function findRowIndexById_(rows, headers, itemId) {
  var idHeader = ITEM_FIELD_TO_HEADER.id;
  var idColIndex = headers.indexOf(idHeader);
  if (idColIndex === -1) return -1;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idColIndex] || '').trim() === String(itemId || '').trim()) {
      return i;
    }
  }
  return -1;
}

function buildPublicItemFromRow_(headers, row) {
  var item = {};
  headers.forEach(function(header, index) {
    if (PERSONAL_INFO_HEADERS.indexOf(header) !== -1) return;
    item[header] = row[index];
  });
  return item;
}

function applyFilter_(items, filter) {
  if (!filter || typeof filter !== 'object') return items;
  return items.filter(function(item) {
    return Object.keys(filter).every(function(key) {
      if (!(key in item)) return false;
      return String(item[key]) === String(filter[key]);
    });
  });
}

/**
 * 商品一覧をシートから取得して返却する。
 * @param {Object=} filter
 * @returns {Object[]}
 */
function listItems(filter) {
  try {
    var snapshot = getSheetSnapshot_();
    if (!snapshot) return [];
    var items = snapshot.rows.map(function(row) {
      return buildPublicItemFromRow_(snapshot.headers, row);
    });
    return applyFilter_(items, filter);
  } catch (error) {
    Logger.log('listItems error: ' + error);
    return [];
  }
}

function api_listItems(filter) {
  return listItems(filter);
}

function api_debugContext() {
  var sheet = getManagementSheet_();
  return {
    sheetName: CONFIG.SHEET_NAME,
    sheetExists: !!sheet,
    lastRow: sheet ? sheet.getLastRow() : 0,
    lastColumn: sheet ? sheet.getLastColumn() : 0
  };
}

/**
 * 指定IDの商品を取得する（個人情報列は除外）。
 * @param {string} itemId
 * @returns {Object|null}
 */
function getItem(itemId) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  return buildPublicItemFromRow_(snapshot.headers, snapshot.rows[rowIndex]);
}

function buildRowFromPayload_(payload) {
  var rowData = new Array(CONFIG.HEADERS.length).fill('');
  var col = CONFIG.COLS;
  var now = new Date();
  var shopValue = payload.shop || '';
  var itemId = generateId_(shopValue);
  var statusValue = payload.status || CONFIG.STATUS.LISTING;

  rowData[col.ID - 1] = itemId;
  rowData[col.STATUS - 1] = statusValue;
  rowData[col.DATE - 1] = payload.date || now;
  rowData[col.PRODUCT_REG_DATE - 1] = payload.productRegDate || (statusValue === CONFIG.STATUS.LISTING ? now : '');

  Object.keys(ITEM_FIELD_TO_HEADER).forEach(function(field) {
    if (field === 'id' || field === 'status' || field === 'date' || field === 'productRegDate') return;
    var header = ITEM_FIELD_TO_HEADER[field];
    var index = CONFIG.HEADERS.indexOf(header);
    if (index === -1) return;
    rowData[index] = payload[field] !== undefined ? payload[field] : rowData[index];
  });

  return {
    itemId: itemId,
    rowData: rowData,
    statusValue: statusValue
  };
}

/**
 * 商品を1件追加する。
 * @param {Object} input
 * @returns {Object|null}
 */
function createItem(input) {
  var payload = input && typeof input === 'object' ? input : {};
  var sheet = getManagementSheet_();
  if (!sheet) return null;

  var created = buildRowFromPayload_(payload);
  var nextRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(nextRow, 1, 1, CONFIG.HEADERS.length).setValues([created.rowData]);

  return {
    id: created.itemId,
    row: nextRow,
    status: created.statusValue,
    item: getItem(created.itemId)
  };
}

function api_createItem(payload) {
  try {
    var created = createItem(payload);
    if (!created) throw new Error('createItem failed');
    return {
      ok: true,
      id: created.id,
      status: created.status,
      row: created.row,
      item: created.item
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
 * 指定IDの商品を部分更新し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @param {Object} input
 * @returns {Object|null}
 */
function updateItem(itemId, input) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = snapshot.rows[rowIndex].slice();
  var payload = input || {};
  var changed = false;

  Object.keys(payload).forEach(function(field) {
    if (field === 'id') return;
    var header = ITEM_FIELD_TO_HEADER[field];
    if (!header) return;

    var headerIndex = snapshot.headers.indexOf(header);
    if (headerIndex === -1) return;

    rowValues[headerIndex] = payload[field];
    changed = true;
  });

  if (changed) {
    snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return getItem(itemId);
}

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

function getStatusList_() {
  if (CONFIG.STATUS_LIST && CONFIG.STATUS_LIST.length) return CONFIG.STATUS_LIST.slice();
  if (CONFIG.STATUS) {
    return Object.keys(CONFIG.STATUS).map(function(key) {
      return CONFIG.STATUS[key];
    });
  }
  return [];
}

function applyStatusUpdateToRowValues_(rowValues, status, memo) {
  var nextRow = rowValues.slice();
  var now = new Date();
  var col = CONFIG.COLS;

  nextRow[col.STATUS - 1] = status;
  nextRow[col.DATE - 1] = now;
  if (status === CONFIG.STATUS.LISTING && !nextRow[col.PRODUCT_REG_DATE - 1]) {
    nextRow[col.PRODUCT_REG_DATE - 1] = now;
  }
  if (memo !== undefined) {
    nextRow[col.MEMO - 1] = memo;
  }
  return nextRow;
}

function buildBulkUpdateResponse_(ok, message, successCount, failureCount, updatedItemIds, failedItemIds) {
  var successIds = updatedItemIds || [];
  var failureIds = failedItemIds || [];
  return {
    ok: ok,
    message: message || '',
    successCount: successCount || 0,
    failureCount: failureCount || 0,
    successIds: successIds,
    failureIds: failureIds,
    updatedItemIds: successIds,
    failedItemIds: failureIds
  };
}

function buildRowIndexMapById_(rows, headers) {
  var map = {};
  var idColIndex = headers.indexOf(ITEM_FIELD_TO_HEADER.id);
  if (idColIndex === -1) return map;

  for (var i = 0; i < rows.length; i++) {
    var itemId = String(rows[i][idColIndex] || '').trim();
    if (!itemId) continue;
    map[itemId] = i;
  }
  return map;
}

function writeUpdatedRows_(sheet, headersLength, rows, rowIndexes) {
  if (!rowIndexes.length) return;

  var sortedIndexes = rowIndexes.slice().sort(function(a, b) {
    return a - b;
  });
  var blockStart = sortedIndexes[0];
  var blockValues = [rows[blockStart]];

  for (var i = 1; i < sortedIndexes.length; i++) {
    var rowIndex = sortedIndexes[i];
    if (rowIndex === sortedIndexes[i - 1] + 1) {
      blockValues.push(rows[rowIndex]);
      continue;
    }

    sheet.getRange(blockStart + 2, 1, blockValues.length, headersLength).setValues(blockValues);
    blockStart = rowIndex;
    blockValues = [rows[rowIndex]];
  }

  sheet.getRange(blockStart + 2, 1, blockValues.length, headersLength).setValues(blockValues);
}

function calculateProfitFromRowValues_(rowValues) {
  var col = CONFIG.COLS;
  var cost = parseFloat(rowValues[col.COST - 1]) || 0;
  var sale = parseFloat(rowValues[col.PRICE_FINAL - 1]) || 0;
  var fee = parseFloat(rowValues[col.FEE - 1]) || 0;
  var shipping = parseFloat(rowValues[col.SHIPPING - 1]) || 0;
  return sale - fee - shipping - cost;
}

function applyProfitRecalculationToRowValues_(rowValues) {
  var nextRow = rowValues.slice();
  nextRow[CONFIG.COLS.PROFIT - 1] = calculateProfitFromRowValues_(nextRow);
  return nextRow;
}

function parseDateValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? null : value;
  }
  if (value === null || value === undefined) return null;

  var normalized = String(value).trim();
  if (!normalized) return null;

  var parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseAmountOrNull_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : null;
  if (value === null || value === undefined || value === '') return null;

  var normalized = String(value).replace(/[\s,，￥¥]/g, '');
  if (!normalized) return null;

  var parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}

function formatMonthKey_(date) {
  var timeZone = Session.getScriptTimeZone() || 'Asia/Tokyo';
  return Utilities.formatDate(date, timeZone, 'yyyy-MM');
}

function getMonthlySummaryRows_() {
  var sheet = getManagementSheet_();
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var rows = sheet.getRange(2, 1, lastRow - 1, CONFIG.COLS.MEMO).getValues();
  var col = CONFIG.COLS;
  var monthlyMap = {};

  rows.forEach(function(row) {
    var status = row[col.STATUS - 1];
    if (CONFIG.CALC_TARGETS.indexOf(status) === -1) return;

    var date = parseDateValue_(row[col.DATE - 1]);
    if (!date) return;

    var monthKey = formatMonthKey_(date);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        month: monthKey,
        count: 0,
        sales: 0,
        fee: 0,
        shipping: 0,
        cost: 0,
        profit: 0
      };
    }

    var entry = monthlyMap[monthKey];
    entry.count += 1;
    entry.sales += parseAmountOrNull_(row[col.PRICE_FINAL - 1]) || 0;
    entry.fee += parseAmountOrNull_(row[col.FEE - 1]) || 0;
    entry.shipping += parseAmountOrNull_(row[col.SHIPPING - 1]) || 0;
    entry.cost += parseAmountOrNull_(row[col.COST - 1]) || 0;

    var profit = parseAmountOrNull_(row[col.PROFIT - 1]);
    if (profit === null) {
      profit = calculateProfitFromRowValues_(row);
    }
    entry.profit += profit;
  });

  return Object.keys(monthlyMap).sort().map(function(key) {
    return monthlyMap[key];
  });
}

function getMonthlySummaryForApi() {
  return getMonthlySummaryRows_();
}

function getPlatformSummaryRows_() {
  var sheet = getManagementSheet_();
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var rows = sheet.getRange(2, 1, lastRow - 1, CONFIG.COLS.MEMO).getValues();
  var col = CONFIG.COLS;
  var platformMap = {};

  rows.forEach(function(row) {
    var status = row[col.STATUS - 1];
    if (CONFIG.CALC_TARGETS.indexOf(status) === -1) return;

    var shop = String(row[col.SHOP - 1] || '').trim();
    if (!shop) return;

    if (!platformMap[shop]) {
      platformMap[shop] = {
        shop: shop,
        count: 0,
        sales: 0,
        fee: 0,
        shipping: 0,
        cost: 0,
        profit: 0
      };
    }

    var entry = platformMap[shop];
    entry.count += 1;
    entry.sales += parseAmountOrNull_(row[col.PRICE_FINAL - 1]) || 0;
    entry.fee += parseAmountOrNull_(row[col.FEE - 1]) || 0;
    entry.shipping += parseAmountOrNull_(row[col.SHIPPING - 1]) || 0;
    entry.cost += parseAmountOrNull_(row[col.COST - 1]) || 0;

    var profit = parseAmountOrNull_(row[col.PROFIT - 1]);
    if (profit === null) {
      profit = calculateProfitFromRowValues_(row);
    }
    entry.profit += profit;
  });

  return Object.keys(platformMap).sort().map(function(key) {
    return platformMap[key];
  });
}

function getPlatformSummaryForApi() {
  return getPlatformSummaryRows_();
}

function api_getPlatformSummary() {
  try {
    var platforms = getPlatformSummaryForApi();
    return {
      ok: true,
      platforms: platforms
    };
  } catch (error) {
    Logger.log('api_getPlatformSummary error: ' + error);
    return {
      ok: false,
      error: String(error),
      platforms: []
    };
  }
}

function api_platformSummary() {
  return api_getPlatformSummary();
}

function api_getMonthlySummary() {
  try {
    var monthly = getMonthlySummaryForApi();
    return {
      ok: true,
      monthly: monthly
    };
  } catch (error) {
    Logger.log('api_getMonthlySummary error: ' + error);
    return {
      ok: false,
      error: String(error),
      monthly: []
    };
  }
}

function api_monthlySummary() {
  return api_getMonthlySummary();
}

function api_dispatchAction(payload) {
  payload = payload && typeof payload === 'object' ? payload : {};
  var action = String(payload.action || '').trim();

  switch (action) {
    case 'getMonthlySummary':
    case 'monthlySummary':
      return api_getMonthlySummary();
    case 'getPlatformSummary':
    case 'platformSummary':
    case 'getShopSummary':
    case 'shopSummary':
      return api_getPlatformSummary();
    default:
      return {
        ok: false,
        error: action ? ('unknown action: ' + action) : 'action is required'
      };
  }
}

function writeUpdatedProfitValues_(sheet, rows, rowIndexes) {
  if (!rowIndexes.length) return;

  var sortedIndexes = rowIndexes.slice().sort(function(a, b) {
    return a - b;
  });
  var profitCol = CONFIG.COLS.PROFIT;
  var blockStart = sortedIndexes[0];
  var blockValues = [[rows[blockStart][profitCol - 1]]];

  for (var i = 1; i < sortedIndexes.length; i++) {
    var rowIndex = sortedIndexes[i];
    if (rowIndex === sortedIndexes[i - 1] + 1) {
      blockValues.push([rows[rowIndex][profitCol - 1]]);
      continue;
    }

    sheet.getRange(blockStart + 2, profitCol, blockValues.length, 1).setValues(blockValues);
    blockStart = rowIndex;
    blockValues = [[rows[rowIndex][profitCol - 1]]];
  }

  sheet.getRange(blockStart + 2, profitCol, blockValues.length, 1).setValues(blockValues);
}

function buildBulkRecalculateProfitResponse_(ok, message, successItemIds, failureItemIds) {
  var successIds = successItemIds || [];
  var failureIds = failureItemIds || [];
  return {
    ok: ok,
    message: message || '',
    successCount: successIds.length,
    failureCount: failureIds.length,
    successItemIds: successIds,
    failureItemIds: failureIds,
    successIds: successIds,
    failureIds: failureIds
  };
}

function bulkRecalculateProfit(itemIds) {
  if (!Array.isArray(itemIds)) {
    return buildBulkRecalculateProfitResponse_(false, 'itemIds must be array', [], []);
  }

  var normalizedIds = itemIds.map(function(itemId) {
    return String(itemId || '').trim();
  }).filter(function(itemId) {
    return itemId !== '';
  });

  if (!normalizedIds.length) {
    return buildBulkRecalculateProfitResponse_(false, 'itemIds is required', [], []);
  }

  var snapshot = getSheetSnapshot_();
  if (!snapshot) {
    return buildBulkRecalculateProfitResponse_(false, 'sheet not found', [], normalizedIds.slice());
  }
  if (!snapshot.rows.length) {
    return buildBulkRecalculateProfitResponse_(false, 'no data rows', [], normalizedIds.slice());
  }

  var successItemIds = [];
  var failureItemIds = [];
  var rowIndexesToUpdate = {};
  var rowIndexMapById = buildRowIndexMapById_(snapshot.rows, snapshot.headers);

  normalizedIds.forEach(function(itemId) {
    var rowIndex = rowIndexMapById[itemId];
    if (rowIndex === undefined) {
      failureItemIds.push(itemId);
      return;
    }

    snapshot.rows[rowIndex] = applyProfitRecalculationToRowValues_(snapshot.rows[rowIndex]);
    rowIndexesToUpdate[rowIndex] = true;
    successItemIds.push(itemId);
  });

  var uniqueRowIndexes = Object.keys(rowIndexesToUpdate).map(function(rowIndex) {
    return Number(rowIndex);
  });

  if (uniqueRowIndexes.length) {
    try {
      writeUpdatedProfitValues_(snapshot.sheet, snapshot.rows, uniqueRowIndexes);
    } catch (error) {
      Logger.log('bulkRecalculateProfit error: ' + error);
      return buildBulkRecalculateProfitResponse_(false, String(error), [], normalizedIds.slice());
    }
  }

  return buildBulkRecalculateProfitResponse_(
    failureItemIds.length === 0,
    failureItemIds.length ? 'partial success' : 'success',
    successItemIds,
    failureItemIds
  );
}

function api_bulkRecalculateProfit(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    return bulkRecalculateProfit(payload.itemIds);
  } catch (error) {
    Logger.log('api_bulkRecalculateProfit error: ' + error);
    return buildBulkRecalculateProfitResponse_(false, String(error), [], []);
  }
}

function bulkUpdateStatus(itemIds, status, memo) {
  if (!Array.isArray(itemIds)) {
    return buildBulkUpdateResponse_(false, 'itemIds must be array', 0, 0, [], []);
  }

  var normalizedIds = itemIds.map(function(itemId) {
    return String(itemId || '').trim();
  }).filter(function(itemId) {
    return itemId !== '';
  });

  if (!normalizedIds.length) {
    return buildBulkUpdateResponse_(false, 'itemIds is required', 0, 0, [], []);
  }

  if (!status) {
    return buildBulkUpdateResponse_(false, 'status is required', 0, normalizedIds.length, [], normalizedIds.slice());
  }

  var statusList = getStatusList_();
  if (statusList.indexOf(status) === -1) {
    return buildBulkUpdateResponse_(false, 'invalid status', 0, normalizedIds.length, [], normalizedIds.slice());
  }

  var snapshot = getSheetSnapshot_();
  if (!snapshot) {
    return buildBulkUpdateResponse_(false, 'sheet not found', 0, normalizedIds.length, [], normalizedIds.slice());
  }
  if (!snapshot.rows.length) {
    return buildBulkUpdateResponse_(false, 'no data rows', 0, normalizedIds.length, [], normalizedIds.slice());
  }

  var updatedItemIds = [];
  var failedItemIds = [];
  var rowIndexesToUpdate = {};
  var rowIndexMapById = buildRowIndexMapById_(snapshot.rows, snapshot.headers);

  normalizedIds.forEach(function(itemId) {
    var rowIndex = rowIndexMapById[itemId];
    if (rowIndex === undefined) {
      failedItemIds.push(itemId);
      return;
    }
    snapshot.rows[rowIndex] = applyStatusUpdateToRowValues_(snapshot.rows[rowIndex], status, memo);
    rowIndexesToUpdate[rowIndex] = true;
    updatedItemIds.push(itemId);
  });

  var uniqueRowIndexes = Object.keys(rowIndexesToUpdate).map(function(rowIndex) {
    return Number(rowIndex);
  });

  if (uniqueRowIndexes.length) {
    try {
      writeUpdatedRows_(snapshot.sheet, snapshot.headers.length, snapshot.rows, uniqueRowIndexes);
    } catch (error) {
      Logger.log('bulkUpdateStatus error: ' + error);
      return buildBulkUpdateResponse_(false, String(error), 0, normalizedIds.length, [], normalizedIds.slice());
    }
  }

  return buildBulkUpdateResponse_(
    failedItemIds.length === 0,
    failedItemIds.length ? 'partial success' : 'success',
    updatedItemIds.length,
    failedItemIds.length,
    updatedItemIds,
    failedItemIds
  );
}

function api_bulkUpdateStatus(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    return bulkUpdateStatus(payload.itemIds, payload.status, payload.memo);
  } catch (error) {
    Logger.log('api_bulkUpdateStatus error: ' + error);
    return buildBulkUpdateResponse_(false, String(error), 0, 0, [], []);
  }
}

/**
 * 指定IDの商品ステータスを更新し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @param {string} status
 * @param {string=} memo
 * @returns {Object|null}
 */
function updateItemStatus(itemId, status, memo) {
  if (!itemId) return null;
  if (CONFIG.STATUS_LIST.indexOf(status) === -1) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = snapshot.rows[rowIndex].slice();
  var col = CONFIG.COLS;
  var now = new Date();

  rowValues[col.STATUS - 1] = status;
  rowValues[col.DATE - 1] = now;
  if (status === CONFIG.STATUS.LISTING && !rowValues[col.PRODUCT_REG_DATE - 1]) {
    rowValues[col.PRODUCT_REG_DATE - 1] = now;
  }
  if (arguments.length >= 3) {
    rowValues[col.MEMO - 1] = memo;
  }

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  return getItem(itemId);
}

/**
 * 指定IDの商品粗利を再計算し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @returns {Object|null}
 */
function recalculateItemProfit(itemId) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = applyProfitRecalculationToRowValues_(snapshot.rows[rowIndex]);

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  return getItem(itemId);
}

function api_recalculateItemProfit(id) {
  try {
    var updatedItem = recalculateItemProfit(id);
    if (!updatedItem) throw new Error('ID not found: ' + id);
    return {
      ok: true,
      item: updatedItem
    };
  } catch (error) {
    Logger.log('api_recalculateItemProfit error: ' + error);
    return {
      ok: false,
      error: String(error)
    };
  }
}

/**
 * ダッシュボード向け集計値を返す。
 * @param {Object=} filter
 * @returns {{totalCount:number,totalSales:number,totalFee:number,totalShipping:number,totalCost:number,totalProfit:number,profitRate:number}}
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
    var normalized = String(value).replace(/[\s,，￥¥]/g, '');
    var num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  try {
    var items = listItems(filter);
    if (!items.length) return emptySummary;

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

    summary.profitRate = summary.totalSales ? (summary.totalProfit / summary.totalSales) * 100 : 0;
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
  if (!items.length) return '';

  var headers = Object.keys(items[0]);

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  var lines = [headers.map(escapeCsvCell).join(',')];
  items.forEach(function(item) {
    lines.push(headers.map(function(header) {
      return escapeCsvCell(item[header]);
    }).join(','));
  });

  return '\uFEFF' + lines.join('\r\n');
}

function api_testList() {
  var dummyList = [
    { id: 'TEST-001', name: 'テスト商品A', price: 1000 },
    { id: 'TEST-002', name: 'テスト商品B', price: 2000 },
    { id: 'TEST-003', name: 'テスト商品C', price: 3000 }
  ];

  return ContentService
    .createTextOutput(JSON.stringify(dummyList))
    .setMimeType(ContentService.MimeType.JSON);
}

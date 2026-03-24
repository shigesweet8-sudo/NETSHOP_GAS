function updateItemStatusRaw_(itemId, status, memo) {
  if (!itemId) return null;
  if (CONFIG.STATUS_LIST.indexOf(status) === -1) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.status,
    ITEM_FIELD_TO_HEADER.date,
    ITEM_FIELD_TO_HEADER.productRegDate,
    ITEM_FIELD_TO_HEADER.memo
  ]);

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = applyStatusUpdateToRowValues_(
    snapshot.rows[rowIndex],
    status,
    arguments.length >= 3 ? memo : undefined,
    headerResolution
  );

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  return getItemRaw_(itemId);
}

function updateItemStatus(itemId, status, memo) {
  try {
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }
    if (CONFIG.STATUS_LIST.indexOf(status) === -1) {
      return buildApiErrorResponse_('invalid status', 'INVALID_STATUS', { status: status });
    }
    var item = arguments.length >= 3
      ? updateItemStatusRaw_(itemId, status, memo)
      : updateItemStatusRaw_(itemId, status);
    if (!item) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND');
    }
    return buildApiSuccessResponse_({ item: item, itemId: String(itemId || ''), status: status }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('updateItemStatus error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'UPDATE_STATUS_FAILED');
  }
}

/**
 * 指定IDの商品粗利を再計算し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @returns {Object|null}
 */
function recalculateItemProfitRaw_(itemId) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.cost,
    ITEM_FIELD_TO_HEADER.priceFinal,
    ITEM_FIELD_TO_HEADER.fee,
    ITEM_FIELD_TO_HEADER.shipping,
    ITEM_FIELD_TO_HEADER.profit
  ]);

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = applyProfitRecalculationToRowValues_(snapshot.rows[rowIndex], headerResolution);

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  return getItemRaw_(itemId);
}

function recalculateItemProfit(itemId) {
  try {
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }
    var item = recalculateItemProfitRaw_(itemId);
    if (!item) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND');
    }
    return buildApiSuccessResponse_({ item: item, itemId: String(itemId || '') }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('recalculateItemProfit error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'RECALCULATE_PROFIT_FAILED');
  }
}

function api_recalculateItemProfit(id) {
  return recalculateItemProfit(id);
}

/**
 * ダッシュボード向け集計値を返す。
 * @param {Object=} filter
 * @returns {{totalCount:number,totalSales:number,totalFee:number,totalShipping:number,totalCost:number,totalProfit:number,profitRate:number}}
 */
function getDashboardSummaryRaw_(filter) {
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
    var items = listItemsRaw_(filter);
    if (!items.length) return emptySummary;

    var salesKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.PRICE_FINAL - 1]);
    var feeKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.FEE - 1]);
    var shippingKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.SHIPPING - 1]);
    var costKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.COST - 1]);

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

function getDashboardSummary(filter) {
  try {
    var summary = getDashboardSummaryRaw_(filter);
    return buildApiSuccessResponse_(summary, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('getDashboardSummary response error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'GET_DASHBOARD_SUMMARY_FAILED');
  }
}

/**
 * 商品一覧をCSV文字列として返す（BOM付きUTF-8）。
 * @param {Object=} filter
 * @returns {string}
 */
function exportCsvRaw_(filter) {
  var items = listItemsRaw_(filter);
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

function exportCsv(filter) {
  try {
    var csv = exportCsvRaw_(filter);
    var result = {
      csv: csv,
      mimeType: 'text/csv',
      encoding: 'UTF-8',
      hasBom: String(csv || '').indexOf('\uFEFF') === 0
    };
    return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('exportCsv error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'EXPORT_CSV_FAILED');
  }
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

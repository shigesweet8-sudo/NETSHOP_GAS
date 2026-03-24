function calculateProfitFromRowValues_(rowValues, headerResolution) {
  if (!headerResolution || !headerResolution.indexByHeader) {
    var fallbackIndexByHeader = {};
    CONFIG.HEADERS.forEach(function(header, index) {
      fallbackIndexByHeader[header] = index;
    });
    var fallbackCost = parseFloat(rowValues[fallbackIndexByHeader[ITEM_FIELD_TO_HEADER.cost]]) || 0;
    var fallbackSale = parseFloat(rowValues[fallbackIndexByHeader[ITEM_FIELD_TO_HEADER.priceFinal]]) || 0;
    var fallbackFee = parseFloat(rowValues[fallbackIndexByHeader[ITEM_FIELD_TO_HEADER.fee]]) || 0;
    var fallbackShipping = parseFloat(rowValues[fallbackIndexByHeader[ITEM_FIELD_TO_HEADER.shipping]]) || 0;
    return fallbackSale - fallbackFee - fallbackShipping - fallbackCost;
  }

  var cost = parseFloat(rowValues[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.cost]]) || 0;
  var sale = parseFloat(rowValues[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.priceFinal]]) || 0;
  var fee = parseFloat(rowValues[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.fee]]) || 0;
  var shipping = parseFloat(rowValues[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.shipping]]) || 0;
  return sale - fee - shipping - cost;
}

function applyProfitRecalculationToRowValues_(rowValues, headerResolution) {
  var nextRow = rowValues.slice();
  nextRow[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.profit]] = calculateProfitFromRowValues_(nextRow, headerResolution);
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

function getMonthlySummary() {
  try {
    var monthly = getMonthlySummaryForApi();
    return buildApiSuccessResponse_(monthly, {
      extra: {
        monthly: monthly
      }
    });
  } catch (error) {
    Logger.log('getMonthlySummary error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'GET_MONTHLY_SUMMARY_FAILED',
      undefined,
      { extra: { monthly: [] } }
    );
  }
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

function getPlatformSummary() {
  try {
    var platforms = getPlatformSummaryForApi();
    return buildApiSuccessResponse_(platforms, {
      extra: {
        platforms: platforms
      }
    });
  } catch (error) {
    Logger.log('getPlatformSummary error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'GET_PLATFORM_SUMMARY_FAILED',
      undefined,
      { extra: { platforms: [] } }
    );
  }
}

function api_getPlatformSummary() {
  return getPlatformSummary();
}

function api_platformSummary() {
  return api_getPlatformSummary();
}

function api_getMonthlySummary() {
  return getMonthlySummary();
}

function api_monthlySummary() {
  return api_getMonthlySummary();
}

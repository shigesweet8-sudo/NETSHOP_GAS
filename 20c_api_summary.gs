function applyStatusUpdateToRowValues_(rowValues, status, memo, headerResolution) {
  var nextRow = rowValues.slice();
  var now = new Date();
  var statusIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.status];
  var dateIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.date];
  var productRegDateIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.productRegDate];
  var memoIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.memo];

  nextRow[statusIndex] = status;
  nextRow[dateIndex] = now;
  if (status === CONFIG.STATUS.LISTING && !nextRow[productRegDateIndex]) {
    nextRow[productRegDateIndex] = now;
  }
  if (memo !== undefined) {
    var currentMemo = normalizeMemoText_(nextRow[memoIndex]);
    var nextMemo = memo;
    if (
      currentMemo.indexOf(OPERATIONAL_DISABLE_MEMO_PREFIX) !== -1 &&
      normalizeMemoText_(nextMemo).indexOf(OPERATIONAL_DISABLE_MEMO_PREFIX) === -1
    ) {
      var memoWithMarker = normalizeMemoText_(nextMemo);
      nextMemo = memoWithMarker ? (memoWithMarker + '\n' + OPERATIONAL_DISABLE_MEMO_PREFIX) : OPERATIONAL_DISABLE_MEMO_PREFIX;
    }
    nextRow[memoIndex] = nextMemo;
  }
  return nextRow;
}

var OPERATIONAL_DISABLE_HEADER_CANDIDATES = Object.freeze(
  (typeof CONFIG !== 'undefined' &&
    CONFIG.OPERATIONAL_DISABLE &&
    CONFIG.OPERATIONAL_DISABLE.HEADER_CANDIDATES)
    ? CONFIG.OPERATIONAL_DISABLE.HEADER_CANDIDATES.slice()
    : [
      '運用無効',
      '無効化',
      '無効',
      '表示無効',
      '削除フラグ',
      '削除済み'
    ]
);

var OPERATIONAL_DISABLE_MEMO_PREFIX =
  (typeof CONFIG !== 'undefined' &&
    CONFIG.OPERATIONAL_DISABLE &&
    CONFIG.OPERATIONAL_DISABLE.MEMO_PREFIX)
    ? CONFIG.OPERATIONAL_DISABLE.MEMO_PREFIX
    : '[運用無効]';

var ARCHIVE_HEADER_CANDIDATES = Object.freeze(
  (typeof CONFIG !== 'undefined' &&
    CONFIG.ARCHIVE &&
    CONFIG.ARCHIVE.HEADER_CANDIDATES)
    ? CONFIG.ARCHIVE.HEADER_CANDIDATES.slice()
    : [
      'アーカイブ',
      'アーカイブ済み',
      '保管',
      '保管中',
      '退避',
      '退避済み'
    ]
);

var ARCHIVE_MEMO_PREFIX =
  (typeof CONFIG !== 'undefined' &&
    CONFIG.ARCHIVE &&
    CONFIG.ARCHIVE.MEMO_PREFIX)
    ? CONFIG.ARCHIVE.MEMO_PREFIX
    : '[保管]';

function resolveOperationalDisableHeader_(headerResolution) {
  var candidates = OPERATIONAL_DISABLE_HEADER_CANDIDATES;
  for (var i = 0; i < candidates.length; i++) {
    var header = candidates[i];
    if (headerResolution.indexByHeader[header] !== undefined) return header;
  }
  return '';
}

function resolveArchiveHeader_(headerResolution) {
  var candidates = ARCHIVE_HEADER_CANDIDATES;
  for (var i = 0; i < candidates.length; i++) {
    var header = candidates[i];
    if (headerResolution.indexByHeader[header] !== undefined) return header;
  }
  return '';
}

function normalizeMemoText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function appendOperationalDisableMemo_(existingMemo, reason) {
  var currentMemo = normalizeMemoText_(existingMemo);
  var reasonMemo = normalizeMemoText_(reason);
  var segments = [];

  if (currentMemo) segments.push(currentMemo);
  if (currentMemo.indexOf(OPERATIONAL_DISABLE_MEMO_PREFIX) === -1) segments.push(OPERATIONAL_DISABLE_MEMO_PREFIX);
  if (reasonMemo) segments.push(reasonMemo);

  return segments.join('\n');
}

function appendArchiveMemo_(existingMemo, reason) {
  var currentMemo = normalizeMemoText_(existingMemo);
  var reasonMemo = normalizeMemoText_(reason);
  var segments = [];

  if (currentMemo) segments.push(currentMemo);
  if (currentMemo.indexOf(ARCHIVE_MEMO_PREFIX) === -1) segments.push(ARCHIVE_MEMO_PREFIX);
  if (reasonMemo) segments.push(reasonMemo);

  return segments.join('\n');
}

function applyOperationalDisableToRowValues_(rowValues, memo, headerResolution) {
  var nextRow = rowValues.slice();
  var disableHeader = resolveOperationalDisableHeader_(headerResolution);
  var memoIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.memo];

  if (disableHeader) {
    nextRow[headerResolution.indexByHeader[disableHeader]] = true;
    if (memo !== undefined && memoIndex !== undefined) {
      nextRow[memoIndex] = memo;
    }
    return nextRow;
  }

  if (memoIndex !== undefined) {
    nextRow[memoIndex] = appendOperationalDisableMemo_(nextRow[memoIndex], memo);
  }

  return nextRow;
}

function applyArchiveToRowValues_(rowValues, memo, headerResolution) {
  var nextRow = rowValues.slice();
  var archiveHeader = resolveArchiveHeader_(headerResolution);
  var memoIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.memo];

  if (archiveHeader) {
    nextRow[headerResolution.indexByHeader[archiveHeader]] = true;
    if (memo !== undefined && memoIndex !== undefined) {
      nextRow[memoIndex] = memo;
    }
    return nextRow;
  }

  if (memoIndex !== undefined) {
    nextRow[memoIndex] = appendArchiveMemo_(nextRow[memoIndex], memo);
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

function buildUiApiSuccessResponse_(data) {
  return buildApiSuccessResponse_(data);
}

function buildUiApiErrorResponse_(message, details, code) {
  return buildApiErrorResponse_(message, code, details);
}

function normalizeUiApiErrorMessage_(error) {
  if (error && typeof error === 'object' && error.message) {
    return String(error.message);
  }
  return String(error || 'unexpected error');
}

function extractUiFilterPayload_(payload) {
  var safePayload = payload && typeof payload === 'object' ? payload : {};
  if (safePayload.filter && typeof safePayload.filter === 'object' && !Array.isArray(safePayload.filter)) {
    return safePayload.filter;
  }

  var directFilter = {};
  Object.keys(ITEM_FIELD_TO_HEADER).forEach(function(field) {
    if (!Object.prototype.hasOwnProperty.call(safePayload, field)) return;
    directFilter[field] = safePayload[field];
  });
  return directFilter;
}

function resolveZipCodeFromPayload_(payload) {
  var safePayload = payload && typeof payload === 'object' ? payload : {};
  var zip = safePayload.zip;
  if (zip === undefined || zip === null || zip === '') zip = safePayload.zipcode;
  if (zip === undefined || zip === null || zip === '') zip = safePayload.postalCode;
  if (zip === undefined || zip === null || zip === '') zip = safePayload.postcode;
  return String(zip || '').trim();
}

function api_uiLookupZip(payload) {
  try {
    var zipInput = resolveZipCodeFromPayload_(payload);
    if (!zipInput) {
      return buildUiApiErrorResponse_('zip is required', undefined, 'ZIP_REQUIRED');
    }

    var normalizedZip = zipInput.replace(/[-\s]/g, '');
    if (!/^\d{7}$/.test(normalizedZip)) {
      return buildUiApiErrorResponse_('zip must be 7 digits', undefined, 'ZIP_INVALID_FORMAT');
    }

    if (typeof lookupAddressByZip !== 'function') {
      return buildUiApiErrorResponse_('lookupAddressByZip is not available', undefined, 'ZIP_LOOKUP_UNAVAILABLE');
    }

    var address = lookupAddressByZip(normalizedZip);
    if (!address) {
      return buildUiApiErrorResponse_('address not found', undefined, 'ZIP_NOT_FOUND');
    }

    return buildUiApiSuccessResponse_({
      zip: normalizedZip,
      prefecture: address.prefecture || '',
      city: address.city || '',
      town: address.town || '',
      addressLine: String((address.city || '') + (address.town || ''))
    });
  } catch (error) {
    Logger.log('api_uiLookupZip error: ' + error);
    return buildUiApiErrorResponse_(normalizeUiApiErrorMessage_(error), undefined, 'ZIP_LOOKUP_FAILED');
  }
}

function api_uiDashboardKpi(payload) {
  try {
    var summary = getDashboardSummaryRaw_(extractUiFilterPayload_(payload));
    return buildUiApiSuccessResponse_(summary);
  } catch (error) {
    Logger.log('api_uiDashboardKpi error: ' + error);
    return buildUiApiErrorResponse_(normalizeUiApiErrorMessage_(error), undefined, 'DASHBOARD_KPI_FAILED');
  }
}

function api_uiExportCsv(payload) {
  try {
    var csv = exportCsvRaw_(extractUiFilterPayload_(payload));
    var csvText = String(csv || '');
    var body = csvText.replace(/^\uFEFF/, '');
    var lineCount = body ? body.split(/\r\n|\n|\r/).length : 0;

    return buildUiApiSuccessResponse_({
      csv: csvText,
      mimeType: 'text/csv',
      encoding: 'UTF-8',
      hasBom: csvText.indexOf('\uFEFF') === 0,
      lineCount: lineCount
    });
  } catch (error) {
    Logger.log('api_uiExportCsv error: ' + error);
    return buildUiApiErrorResponse_(normalizeUiApiErrorMessage_(error), undefined, 'EXPORT_CSV_FAILED');
  }
}

function api_dispatchAction(payload) {
  payload = payload && typeof payload === 'object' ? payload : {};
  var action = String(payload.action || '').trim();

  switch (action) {
    case 'uiLookupZip':
    case 'uiZipLookup':
    case 'uiPostalCodeLookup':
    case 'uiPostalCodeAutocomplete':
      return api_uiLookupZip(payload);
    case 'uiDashboardKpi':
    case 'uiDashboardSummary':
      return api_uiDashboardKpi(payload);
    case 'uiExportCsv':
    case 'uiCsvExport':
      return api_uiExportCsv(payload);
    case 'validateVariation':
    case 'variationValidation':
    case 'checkVariation':
      return api_validateVariation(payload);
    case 'getMonthlySummary':
    case 'monthlySummary':
      return api_getMonthlySummary();
    case 'getPlatformSummary':
    case 'platformSummary':
    case 'getShopSummary':
    case 'shopSummary':
      return api_getPlatformSummary();
    case 'getMasters':
    case 'masters':
    case 'getMaster':
    case 'master':
      return api_getMasters(payload);
    case 'listItemsSorted':
    case 'sortedItems':
    case 'getSortedItems':
      return api_listItemsSorted(payload);
    case 'cancelItem':
    case 'cancelStatus':
    case 'cancelTransaction':
    case 'cancel':
      return api_cancelItem(payload);
    case 'disableItem':
    case 'disable':
      return api_disableItem(payload);
    case 'archiveItem':
    case 'archive':
      return api_archiveItem(payload);
    case 'bulkDisableNetshopRecords':
    case 'bulkDisableNetshop':
    case 'bulkDisableItems':
    case 'bulkDisable':
      return api_bulkDisableNetshop(payload);
    default:
      return buildApiErrorResponse_(
        action ? ('unknown action: ' + action) : 'action is required',
        'UNKNOWN_ACTION'
      );
  }
}

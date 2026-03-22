/**
 * NETSHOP API endpoints beyond shared helpers and item/list APIs.
 */
function getStatusList_() {
  if (CONFIG.STATUS_LIST && CONFIG.STATUS_LIST.length) return CONFIG.STATUS_LIST.slice();
  if (CONFIG.STATUS) {
    return Object.keys(CONFIG.STATUS).map(function(key) {
      return CONFIG.STATUS[key];
    });
  }
  return [];
}

function uniqueStringList_(values) {
  var map = {};
  var result = [];

  (values || []).forEach(function(value) {
    var normalized = String(value === null || value === undefined ? '' : value).trim();
    if (!normalized || map[normalized]) return;
    map[normalized] = true;
    result.push(normalized);
  });

  return result;
}

function toOptionList_(values) {
  return uniqueStringList_(values).map(function(value) {
    return {
      value: value,
      label: value
    };
  });
}

function getColumnDistinctValues_(columnIndex) {
  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return [];

  var index = Number(columnIndex) - 1;
  if (index < 0) return [];

  return uniqueStringList_(snapshot.rows.map(function(row) {
    return row[index];
  }));
}

function extractValidationListFromRule_(rule) {
  if (!rule || !rule.getCriteriaValues) return [];

  var criteriaValues = rule.getCriteriaValues();
  if (!criteriaValues || !criteriaValues.length) return [];

  for (var i = 0; i < criteriaValues.length; i++) {
    var value = criteriaValues[i];
    if (Array.isArray(value)) {
      return uniqueStringList_(value);
    }
    if (value && typeof value.getValues === 'function') {
      var rangeValues = value.getValues();
      var flattened = [];
      for (var row = 0; row < rangeValues.length; row++) {
        for (var col = 0; col < rangeValues[row].length; col++) {
          flattened.push(rangeValues[row][col]);
        }
      }
      return uniqueStringList_(flattened);
    }
  }

  return [];
}

function getValidationCandidatesByColumn_(columnIndex) {
  var sheet = getManagementSheet_();
  if (!sheet) return [];

  var rowCount = Math.max(sheet.getLastRow() - 1, 1);
  var validations = sheet.getRange(2, columnIndex, rowCount, 1).getDataValidations();

  for (var i = 0; i < validations.length; i++) {
    var candidates = extractValidationListFromRule_(validations[i][0]);
    if (candidates.length) return candidates;
  }

  return [];
}

function getValidationOrDistinctCandidates_(columnIndex) {
  var validationCandidates = getValidationCandidatesByColumn_(columnIndex);
  if (validationCandidates.length) return validationCandidates;
  return getColumnDistinctValues_(columnIndex);
}

function getMasterValueListByType_(type) {
  var fixedMasters = CONFIG.NETSHOP_MASTERS || {};
  switch (type) {
    case 'statuses':
      if (Array.isArray(fixedMasters.STATUS) && fixedMasters.STATUS.length) {
        return fixedMasters.STATUS.slice();
      }
      return getStatusList_();
    case 'shops':
      if (Array.isArray(fixedMasters.SHOP)) return fixedMasters.SHOP.slice();
      return [];
    case 'staffs':
      if (Array.isArray(fixedMasters.ASSIGNEE)) return fixedMasters.ASSIGNEE.slice();
      return [];
    case 'shipFroms':
      if (Array.isArray(fixedMasters.SHIPPING_FROM)) return fixedMasters.SHIPPING_FROM.slice();
      return [];
    case 'carriers':
      if (Array.isArray(fixedMasters.CARRIER)) return fixedMasters.CARRIER.slice();
      return [];
    default:
      return [];
  }
}

function normalizeMasterType_(masterType) {
  var key = String(masterType || '').trim().toLowerCase();
  if (!key) return '';

  if (key === 'status' || key === 'statuses' || key === 'ステータス') return 'statuses';
  if (key === 'shop' || key === 'shops' || key === 'ショップ') return 'shops';
  if (key === 'staff' || key === 'staffs' || key === 'assignee' || key === 'assignees' || key === '担当者' || key === '商品担当者') return 'staffs';
  if (key === 'shipfrom' || key === 'ship_from' || key === 'shippingfrom' || key === 'shipping_from' || key === '配送元') return 'shipFroms';
  if (key === 'carrier' || key === 'carriers' || key === '配送業者') return 'carriers';

  return '';
}

function parseRequestedMasterTypes_(payload) {
  var defaultTypes = ['statuses', 'shops', 'staffs', 'shipFroms', 'carriers'];
  var rawTypes = [];
  var seenRaw = {};

  function pushRawType(value) {
    if (value === null || value === undefined) return;
    String(value).split(',').forEach(function(part) {
      var name = String(part || '').trim();
      if (!name || seenRaw[name]) return;
      seenRaw[name] = true;
      rawTypes.push(name);
    });
  }

  payload = payload && typeof payload === 'object' ? payload : {};

  if (Array.isArray(payload.masterTypes)) {
    payload.masterTypes.forEach(pushRawType);
  }
  if (Array.isArray(payload.masters)) {
    payload.masters.forEach(pushRawType);
  }
  pushRawType(payload.masterType);
  pushRawType(payload.master);
  pushRawType(payload.type);

  if (!rawTypes.length) {
    return {
      canonicalTypes: defaultTypes.slice(),
      unknownTypes: []
    };
  }

  var canonicalTypes = [];
  var unknownTypes = [];
  var seenCanonical = {};
  rawTypes.forEach(function(type) {
    var normalized = normalizeMasterType_(type);
    if (!normalized) {
      unknownTypes.push(type);
      return;
    }
    if (seenCanonical[normalized]) return;
    seenCanonical[normalized] = true;
    canonicalTypes.push(normalized);
  });

  return {
    canonicalTypes: canonicalTypes,
    unknownTypes: unknownTypes
  };
}

function getMastersRaw_(payload) {
  var requested = parseRequestedMasterTypes_(payload);
  var masters = {};

  requested.canonicalTypes.forEach(function(type) {
    masters[type] = toOptionList_(getMasterValueListByType_(type));
  });
  requested.unknownTypes.forEach(function(type) {
    masters[type] = [];
  });

  return {
    masters: convertValueKeysToApi_(masters)
  };
}

function getMasters(payload) {
  try {
    var result = getMastersRaw_(payload);
    return buildApiSuccessResponse_(result, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('getMasters error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'GET_MASTERS_FAILED',
      undefined,
      { extra: { masters: {} } }
    );
  }
}

function api_getMasters(payload) {
  return getMasters(payload);
}

function api_masters(payload) {
  return api_getMasters(payload);
}

function isBlankValue_(value) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return value.trim() === '';
}

function normalizeTextValue_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeValidationPayload_(payload) {
  var safePayload = payload && typeof payload === 'object' ? payload : {};
  var itemSource = (safePayload.item && typeof safePayload.item === 'object') ? safePayload.item : safePayload;
  var modeRaw = safePayload.mode || safePayload.target || safePayload.operation || '';
  var mode = normalizeTextValue_(modeRaw).toLowerCase();

  if (mode !== 'create' && mode !== 'update') {
    mode = normalizeTextValue_(itemSource.id) ? 'update' : 'create';
  }

  return {
    mode: mode,
    item: itemSource
  };
}

function addValidationIssue_(issues, level, code, field, message, value) {
  var issue = {
    code: code,
    field: field,
    message: message
  };
  if (value !== undefined) issue.value = value;
  if (level === 'warning') {
    issues.warnings.push(issue);
    return;
  }
  issues.errors.push(issue);
}

function normalizeNumberish_(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isFinite(value) ? value : NaN;
  var text = String(value).replace(/[\s,，￥¥]/g, '');
  if (!text) return null;
  var parsed = Number(text);
  return isNaN(parsed) ? NaN : parsed;
}

function validateVariationPayloadRaw_(payload) {
  var normalized = normalizeValidationPayload_(payload);
  var item = normalized.item && typeof normalized.item === 'object' ? normalized.item : {};
  var issues = {
    errors: [],
    warnings: []
  };
  var mode = normalized.mode;
  var requiredFields = mode === 'update' ? ['id'] : ['shop'];
  var statusList = getStatusList_();
  var shopMaster = getMasterValueListByType_('shops');
  var amountFields = ['cost', 'listPrice', 'negotiatedPrice', 'priceFinal', 'fee', 'shipping'];

  requiredFields.forEach(function(field) {
    if (!isBlankValue_(item[field])) return;
    addValidationIssue_(
      issues,
      'error',
      'REQUIRED',
      field,
      field + ' is required',
      item[field]
    );
  });

  if (!isBlankValue_(item.status)) {
    var statusValue = normalizeTextValue_(item.status);
    if (statusList.indexOf(statusValue) === -1) {
      addValidationIssue_(
        issues,
        'error',
        'INVALID_STATUS',
        'status',
        'status is not in master list',
        item.status
      );
    }
  } else if (mode === 'create') {
    addValidationIssue_(
      issues,
      'warning',
      'DEFAULT_STATUS',
      'status',
      'status is empty. createItem default is applied: ' + CONFIG.STATUS.LISTING
    );
  }

  if (!isBlankValue_(item.shop)) {
    var shopValue = normalizeTextValue_(item.shop);
    if (shopMaster.length && shopMaster.indexOf(shopValue) === -1) {
      addValidationIssue_(
        issues,
        'error',
        'INVALID_SHOP',
        'shop',
        'shop is not in master list',
        item.shop
      );
    } else if (!shopMaster.length) {
      addValidationIssue_(
        issues,
        'warning',
        'SHOP_MASTER_EMPTY',
        'shop',
        'shop master list is empty. strict validation skipped'
      );
    }

    if (mode === 'create') {
      try {
        if (!generateId_(shopValue)) {
          addValidationIssue_(
            issues,
            'error',
            'SHOP_ID_PREFIX_UNAVAILABLE',
            'shop',
            'shop cannot generate management id prefix',
            item.shop
          );
        }
      } catch (error) {
        addValidationIssue_(
          issues,
          'warning',
          'SHOP_ID_VALIDATION_FAILED',
          'shop',
          'shop id-prefix check failed: ' + String(error)
        );
      }
    }
  }

  amountFields.forEach(function(field) {
    if (isBlankValue_(item[field])) return;
    var num = normalizeNumberish_(item[field]);
    if (!isNaN(num)) return;
    addValidationIssue_(
      issues,
      'error',
      'INVALID_NUMBER',
      field,
      field + ' must be numeric',
      item[field]
    );
  });

  return convertValueKeysToApi_({
    ok: issues.errors.length === 0,
    mode: mode,
    errors: issues.errors,
    warnings: issues.warnings
  });
}

function api_validateVariation(payload) {
  try {
    var result = validateVariationPayloadRaw_(payload);
    if (!result.ok) {
      return buildApiErrorResponse_(
        'validation failed',
        'VALIDATION_FAILED',
        result,
        {
          extra: {
            mode: result.mode,
            errors: result.errors || [],
            warnings: result.warnings || []
          }
        }
      );
    }
    return buildApiSuccessResponse_(result, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('api_validateVariation error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'VALIDATION_INTERNAL_ERROR',
      undefined,
      {
        extra: {
          errors: [{
            code: 'INTERNAL_ERROR',
            field: '',
            message: String(error)
          }],
          warnings: []
        }
      }
    );
  }
}

function validateVariation(payload) {
  return api_validateVariation(payload);
}

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

function writeUpdatedProfitValues_(sheet, rows, rowIndexes, headerResolution) {
  if (!rowIndexes.length) return;

  var sortedIndexes = rowIndexes.slice().sort(function(a, b) {
    return a - b;
  });
  var profitCol = headerResolution.colByHeader[ITEM_FIELD_TO_HEADER.profit];
  var profitIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.profit];
  var blockStart = sortedIndexes[0];
  var blockValues = [[rows[blockStart][profitIndex]]];

  for (var i = 1; i < sortedIndexes.length; i++) {
    var rowIndex = sortedIndexes[i];
    if (rowIndex === sortedIndexes[i - 1] + 1) {
      blockValues.push([rows[rowIndex][profitIndex]]);
      continue;
    }

    sheet.getRange(blockStart + 2, profitCol, blockValues.length, 1).setValues(blockValues);
    blockStart = rowIndex;
    blockValues = [[rows[rowIndex][profitIndex]]];
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

function bulkRecalculateProfitRaw_(itemIds) {
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
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.cost,
    ITEM_FIELD_TO_HEADER.priceFinal,
    ITEM_FIELD_TO_HEADER.fee,
    ITEM_FIELD_TO_HEADER.shipping,
    ITEM_FIELD_TO_HEADER.profit
  ]);

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

    snapshot.rows[rowIndex] = applyProfitRecalculationToRowValues_(snapshot.rows[rowIndex], headerResolution);
    rowIndexesToUpdate[rowIndex] = true;
    successItemIds.push(itemId);
  });

  var uniqueRowIndexes = Object.keys(rowIndexesToUpdate).map(function(rowIndex) {
    return Number(rowIndex);
  });

  if (uniqueRowIndexes.length) {
    try {
      writeUpdatedProfitValues_(snapshot.sheet, snapshot.rows, uniqueRowIndexes, headerResolution);
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

function bulkRecalculateProfit(itemIds) {
  try {
    var result = bulkRecalculateProfitRaw_(itemIds);
    if (result.ok) {
      return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
    }
    return buildApiErrorResponse_(result.message || 'bulk recalculate failed', 'BULK_RECALCULATE_FAILED', result, {
      extra: result
    });
  } catch (error) {
    Logger.log('bulkRecalculateProfit response error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_RECALCULATE_FAILED');
  }
}

function api_bulkRecalculateProfit(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    return bulkRecalculateProfit(payload.itemIds);
  } catch (error) {
    Logger.log('api_bulkRecalculateProfit error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_RECALCULATE_FAILED', undefined, {
      extra: buildBulkRecalculateProfitResponse_(false, String(error), [], [])
    });
  }
}

function bulkUpdateStatusRaw_(itemIds, status, memo) {
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
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.status,
    ITEM_FIELD_TO_HEADER.date,
    ITEM_FIELD_TO_HEADER.productRegDate,
    ITEM_FIELD_TO_HEADER.memo
  ]);

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
    snapshot.rows[rowIndex] = applyStatusUpdateToRowValues_(snapshot.rows[rowIndex], status, memo, headerResolution);
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

function bulkUpdateStatus(itemIds, status, memo) {
  try {
    var result = bulkUpdateStatusRaw_(itemIds, status, memo);
    if (result.ok) {
      return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
    }
    return buildApiErrorResponse_(result.message || 'bulk update failed', 'BULK_UPDATE_STATUS_FAILED', result, {
      extra: result
    });
  } catch (error) {
    Logger.log('bulkUpdateStatus response error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_UPDATE_STATUS_FAILED');
  }
}

function api_bulkUpdateStatus(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    return bulkUpdateStatus(payload.itemIds, payload.status, payload.memo);
  } catch (error) {
    Logger.log('api_bulkUpdateStatus error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_UPDATE_STATUS_FAILED', undefined, {
      extra: buildBulkUpdateResponse_(false, String(error), 0, 0, [], [])
    });
  }
}

function parseItemIdsInput_(input) {
  var collected = [];

  if (Array.isArray(input)) {
    input.forEach(function(value) {
      collected = collected.concat(parseItemIdsInput_(value));
    });
    return collected;
  }

  if (input === null || input === undefined) return collected;

  String(input).split(',').forEach(function(part) {
    var normalized = String(part || '').trim();
    if (!normalized) return;
    collected.push(normalized);
  });

  return collected;
}

function uniqueNormalizedIds_(itemIds) {
  var seen = {};
  var result = [];
  var normalizedList = parseItemIdsInput_(itemIds);

  normalizedList.forEach(function(itemId) {
    var normalized = String(itemId || '').trim();
    if (!normalized || seen[normalized]) return;
    seen[normalized] = true;
    result.push(normalized);
  });

  return result;
}

function resolveBulkDisableItemIds_(payload) {
  payload = payload && typeof payload === 'object' ? payload : {};
  var merged = [];

  merged = merged.concat(parseItemIdsInput_(payload.itemIds));
  merged = merged.concat(parseItemIdsInput_(payload.ids));
  merged = merged.concat(parseItemIdsInput_(payload.managementIds));
  merged = merged.concat(parseItemIdsInput_(payload['管理ID']));
  merged = merged.concat(parseItemIdsInput_(payload.itemId));
  merged = merged.concat(parseItemIdsInput_(payload.id));

  return uniqueNormalizedIds_(merged);
}

function buildDisableResponse_(ok, message, updatedItem, itemId, actionName) {
  var normalizedAction = String(actionName || 'disableItem').trim() || 'disableItem';
  var payload = {
    ok: ok,
    action: normalizedAction,
    operation: 'operationalDisable',
    disabled: ok,
    message: message || '',
    itemId: itemId || '',
    item: updatedItem || null
  };
  if (ok) {
    return buildApiSuccessResponse_(payload, { copyDataToTopLevel: true });
  }
  return buildApiErrorResponse_(payload.message || 'disable failed', 'DISABLE_ITEM_FAILED', payload, {
    extra: payload
  });
}

function buildArchiveResponse_(ok, message, updatedItem, itemId, actionName) {
  var normalizedAction = String(actionName || 'archiveItem').trim() || 'archiveItem';
  var payload = {
    ok: ok,
    action: normalizedAction,
    operation: 'archiveStorage',
    archived: ok,
    message: message || '',
    itemId: itemId || '',
    item: updatedItem || null
  };
  if (ok) {
    return buildApiSuccessResponse_(payload, { copyDataToTopLevel: true });
  }
  return buildApiErrorResponse_(payload.message || 'archive failed', 'ARCHIVE_ITEM_FAILED', payload, {
    extra: payload
  });
}

function buildBulkDisableResponse_(ok, message, disabledItemIds, failedItemIds) {
  var successIds = disabledItemIds || [];
  var failureIds = failedItemIds || [];
  var payload = buildBulkUpdateResponse_(
    ok,
    message,
    successIds.length,
    failureIds.length,
    successIds,
    failureIds
  );
  payload.operation = 'operationalDisable';
  payload.disabledItemIds = successIds;
  payload.failedDisableItemIds = failureIds;
  if (ok) {
    return buildApiSuccessResponse_(payload, { copyDataToTopLevel: true });
  }
  return buildApiErrorResponse_(payload.message || 'bulk disable failed', 'BULK_DISABLE_FAILED', payload, {
    extra: payload
  });
}

function disableItemById(itemId, memo) {
  var normalizedId = String(itemId || '').trim();
  if (!normalizedId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.memo
  ]);
  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, normalizedId);
  if (rowIndex === -1) return null;

  snapshot.rows[rowIndex] = applyOperationalDisableToRowValues_(
    snapshot.rows[rowIndex],
    arguments.length >= 2 ? memo : undefined,
    headerResolution
  );
  snapshot.sheet.getRange(rowIndex + 2, 1, 1, snapshot.rows[rowIndex].length).setValues([snapshot.rows[rowIndex]]);

  return getItemRaw_(normalizedId);
}

function disableItem(itemId, memo) {
  return arguments.length >= 2 ? disableItemById(itemId, memo) : disableItemById(itemId);
}

function archiveItemById(itemId, memo) {
  var normalizedId = String(itemId || '').trim();
  if (!normalizedId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.memo
  ]);
  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, normalizedId);
  if (rowIndex === -1) return null;

  snapshot.rows[rowIndex] = applyArchiveToRowValues_(
    snapshot.rows[rowIndex],
    arguments.length >= 2 ? memo : undefined,
    headerResolution
  );
  snapshot.sheet.getRange(rowIndex + 2, 1, 1, snapshot.rows[rowIndex].length).setValues([snapshot.rows[rowIndex]]);

  return getItemRaw_(normalizedId);
}

function archiveItem(itemId, memo) {
  return arguments.length >= 2 ? archiveItemById(itemId, memo) : archiveItemById(itemId);
}

function bulkDisableNetshopRecords(itemIds, memo) {
  var normalizedIds = uniqueNormalizedIds_(itemIds);
  if (!normalizedIds.length) {
    return buildBulkDisableResponse_(false, 'itemIds is required', [], []);
  }

  var snapshot = getSheetSnapshot_();
  if (!snapshot) {
    return buildBulkDisableResponse_(false, 'sheet not found', [], normalizedIds.slice());
  }
  if (!snapshot.rows.length) {
    return buildBulkDisableResponse_(false, 'no data rows', [], normalizedIds.slice());
  }
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.memo
  ]);

  var disabledItemIds = [];
  var failedItemIds = [];
  var rowIndexesToUpdate = {};
  var rowIndexMapById = buildRowIndexMapById_(snapshot.rows, snapshot.headers);

  normalizedIds.forEach(function(itemId) {
    var rowIndex = rowIndexMapById[itemId];
    if (rowIndex === undefined) {
      failedItemIds.push(itemId);
      return;
    }
    snapshot.rows[rowIndex] = applyOperationalDisableToRowValues_(
      snapshot.rows[rowIndex],
      memo,
      headerResolution
    );
    rowIndexesToUpdate[rowIndex] = true;
    disabledItemIds.push(itemId);
  });

  var uniqueRowIndexes = Object.keys(rowIndexesToUpdate).map(function(rowIndex) {
    return Number(rowIndex);
  });

  if (uniqueRowIndexes.length) {
    try {
      writeUpdatedRows_(snapshot.sheet, snapshot.headers.length, snapshot.rows, uniqueRowIndexes);
    } catch (error) {
      Logger.log('bulkDisableNetshopRecords error: ' + error);
      return buildBulkDisableResponse_(false, String(error), [], normalizedIds.slice());
    }
  }

  return buildBulkDisableResponse_(
    failedItemIds.length === 0,
    failedItemIds.length
      ? (disabledItemIds.length ? 'partial success (operational disable)' : 'failed (operational disable)')
      : 'success (operational disable)',
    disabledItemIds,
    failedItemIds
  );
}

function api_bulkDisableNetshop(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    var itemIds = resolveBulkDisableItemIds_(payload);
    var memo = payload.memo;
    if (memo === undefined && payload.reason !== undefined) memo = payload.reason;
    var result = bulkDisableNetshopRecords(itemIds, memo);
    result.action = 'bulkDisableNetshopRecords';
    if (result.data && typeof result.data === 'object') {
      result.data.action = 'bulkDisableNetshopRecords';
    }
    return result;
  } catch (error) {
    Logger.log('api_bulkDisableNetshop error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_DISABLE_FAILED');
  }
}

function resolveItemIdFromPayload_(payload) {
  payload = payload && typeof payload === 'object' ? payload : {};
  var itemId = payload.itemId;
  if (itemId === undefined || itemId === null || itemId === '') itemId = payload.id;
  if (itemId === undefined || itemId === null || itemId === '') itemId = payload['管理ID'];
  return String(itemId || '').trim();
}

function cancelItemById(itemId, memo) {
  var normalizedId = String(itemId || '').trim();
  if (!normalizedId) return null;

  return arguments.length >= 2
    ? updateItemStatusRaw_(normalizedId, CONFIG.STATUS.CANCEL, memo)
    : updateItemStatusRaw_(normalizedId, CONFIG.STATUS.CANCEL);
}

function api_cancelItem(payload) {
  try {
    var itemId = resolveItemIdFromPayload_(payload);
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }

    var memo = payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'memo')
      ? payload.memo
      : undefined;
    var updatedItem = memo === undefined ? cancelItemById(itemId) : cancelItemById(itemId, memo);

    if (!updatedItem) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND', undefined, {
        extra: { itemId: itemId }
      });
    }

    var result = {
      action: 'cancelItem',
      operation: 'businessCancel',
      canceled: true,
      item: updatedItem
    };
    return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('api_cancelItem error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'CANCEL_ITEM_FAILED');
  }
}

function api_disableItem(payload) {
  try {
    var itemId = resolveItemIdFromPayload_(payload);
    if (!itemId) {
      return buildDisableResponse_(false, 'itemId is required', null, '', 'disableItem');
    }

    var memo = payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'memo')
      ? payload.memo
      : undefined;
    var updatedItem = memo === undefined ? disableItemById(itemId) : disableItemById(itemId, memo);

    if (!updatedItem) {
      return buildDisableResponse_(false, 'ID not found: ' + itemId, null, itemId, 'disableItem');
    }

    return buildDisableResponse_(true, 'success (operational disable)', updatedItem, itemId, 'disableItem');
  } catch (error) {
    Logger.log('api_disableItem error: ' + error);
    return buildDisableResponse_(false, String(error), null, '', 'disableItem');
  }
}

function api_archiveItem(payload) {
  try {
    var itemId = resolveItemIdFromPayload_(payload);
    if (!itemId) {
      return buildArchiveResponse_(false, 'itemId is required', null, '', 'archiveItem');
    }

    var memo = payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'memo')
      ? payload.memo
      : undefined;
    var updatedItem = memo === undefined ? archiveItemById(itemId) : archiveItemById(itemId, memo);

    if (!updatedItem) {
      return buildArchiveResponse_(false, 'ID not found: ' + itemId, null, itemId, 'archiveItem');
    }

    return buildArchiveResponse_(true, 'success (archive storage)', updatedItem, itemId, 'archiveItem');
  } catch (error) {
    Logger.log('api_archiveItem error: ' + error);
    return buildArchiveResponse_(false, String(error), null, '', 'archiveItem');
  }
}

/**
 * 指定IDの商品ステータスを更新し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @param {string} status
 * @param {string=} memo
 * @returns {Object|null}
 */
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

/**
 * NETSHOP API shared helpers.
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

var ITEM_HEADER_TO_FIELD = Object.freeze(Object.keys(ITEM_FIELD_TO_HEADER).reduce(function(map, field) {
  map[ITEM_FIELD_TO_HEADER[field]] = field;
  return map;
}, {}));

var PERSONAL_INFO_HEADERS = Object.freeze([
  '購入者名',
  '郵便番号',
  '都道府県',
  '住所2(地番)',
  '住所3(建物名)',
  '電話番号'
]);

var PERSONAL_INFO_FIELDS = Object.freeze(PERSONAL_INFO_HEADERS.reduce(function(map, header) {
  var field = ITEM_HEADER_TO_FIELD[header];
  if (field) map[field] = true;
  return map;
}, {}));

function toApiFieldKey_(key) {
  if (key === null || key === undefined) return '';
  var text = String(key);
  if (Object.prototype.hasOwnProperty.call(ITEM_FIELD_TO_HEADER, text)) return text;
  if (Object.prototype.hasOwnProperty.call(ITEM_HEADER_TO_FIELD, text)) return ITEM_HEADER_TO_FIELD[text];
  return text;
}

function isPlainObject_(value) {
  return value !== null &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]';
}

function convertValueKeysToApi_(value) {
  if (Array.isArray(value)) {
    return value.map(convertValueKeysToApi_);
  }
  if (!isPlainObject_(value)) {
    return value;
  }

  var converted = {};
  Object.keys(value).forEach(function(key) {
    converted[toApiFieldKey_(key)] = convertValueKeysToApi_(value[key]);
  });
  return converted;
}

function convertFilterKeysToApi_(filter) {
  if (!isPlainObject_(filter)) return filter;
  var converted = {};
  Object.keys(filter).forEach(function(key) {
    converted[toApiFieldKey_(key)] = filter[key];
  });
  return converted;
}

function buildApiErrorObject_(message, code, details) {
  var error = {
    message: String(message || 'unexpected error')
  };
  if (code) error.code = String(code);
  if (details !== undefined) error.details = details;
  return error;
}

function shallowCopyFields_(target, source) {
  if (!source || typeof source !== 'object') return target;
  Object.keys(source).forEach(function(key) {
    if (key === 'ok' || key === 'error' || key === 'data') return;
    target[key] = source[key];
  });
  return target;
}

function buildApiSuccessResponse_(data, compatibility) {
  var response = {
    ok: true,
    error: null,
    data: data === undefined ? null : data
  };

  var options = compatibility && typeof compatibility === 'object' ? compatibility : {};
  if (options.copyDataToTopLevel && data && typeof data === 'object') {
    shallowCopyFields_(response, data);
  }
  if (options.extra && typeof options.extra === 'object') {
    shallowCopyFields_(response, options.extra);
  }

  return response;
}

function buildApiErrorResponse_(message, code, details, compatibility) {
  var response = {
    ok: false,
    error: buildApiErrorObject_(message, code, details),
    data: null
  };
  var options = compatibility && typeof compatibility === 'object' ? compatibility : {};
  if (options.extra && typeof options.extra === 'object') {
    shallowCopyFields_(response, options.extra);
  }
  return response;
}

function getManagementSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
  return ss.getSheetByName(CONFIG.SHEET_NAME);
}

var SHEET_HEADER_RESOLUTION_CACHE_ = {};

function createSheetHeaderResolution_(sheet) {
  if (!sheet) {
    throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);
  }

  var maxColumn = Math.max(sheet.getLastColumn(), CONFIG.HEADERS.length);
  if (maxColumn < 1) {
    throw new Error('Sheet header row is empty: ' + CONFIG.SHEET_NAME);
  }

  var headerRow = sheet.getRange(1, 1, 1, maxColumn).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  var colByHeader = {};
  var indexByHeader = {};
  for (var i = 0; i < headerRow.length; i++) {
    var header = headerRow[i];
    if (!header) continue;
    if (colByHeader[header] !== undefined) continue;
    colByHeader[header] = i + 1;
    indexByHeader[header] = i;
  }

  var missingConfigHeaders = CONFIG.HEADERS.filter(function(header) {
    return colByHeader[header] === undefined;
  });
  if (missingConfigHeaders.length) {
    throw new Error('Missing sheet headers: ' + missingConfigHeaders.join(', '));
  }

  var requiredColumnCount = CONFIG.HEADERS.reduce(function(maxValue, header) {
    return Math.max(maxValue, colByHeader[header] || 0);
  }, 0);

  return {
    headers: headerRow,
    colByHeader: colByHeader,
    indexByHeader: indexByHeader,
    requiredColumnCount: requiredColumnCount
  };
}

function getSheetHeaderResolution_(sheet, requiredHeaders) {
  if (!sheet) {
    throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);
  }

  var cacheKey = String(sheet.getSheetId()) + ':' + String(sheet.getName());
  if (!SHEET_HEADER_RESOLUTION_CACHE_[cacheKey]) {
    SHEET_HEADER_RESOLUTION_CACHE_[cacheKey] = createSheetHeaderResolution_(sheet);
  }

  var resolution = SHEET_HEADER_RESOLUTION_CACHE_[cacheKey];
  var required = Array.isArray(requiredHeaders) ? requiredHeaders : [];
  var missingRequiredHeaders = required.filter(function(header) {
    return resolution.colByHeader[header] === undefined;
  });
  if (missingRequiredHeaders.length) {
    throw new Error('Missing required headers: ' + missingRequiredHeaders.join(', '));
  }

  return resolution;
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

function normalizePublicApiValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return '';
    var timeZone = Session.getScriptTimeZone() || 'Asia/Tokyo';
    return Utilities.formatDate(value, timeZone, 'yyyy-MM-dd');
  }
  return value;
}

function buildPublicItemFromRow_(headers, row) {
  var source = {};
  headers.forEach(function(header, index) {
    var field = toApiFieldKey_(header);
    if (!field) return;
    if (!Object.prototype.hasOwnProperty.call(ITEM_FIELD_TO_HEADER, field)) return;
    if (Object.prototype.hasOwnProperty.call(PERSONAL_INFO_FIELDS, field)) return;
    source[field] = normalizePublicApiValue_(row[index]);
  });
  return source;
}

function applyFilter_(items, filter) {
  if (!filter || typeof filter !== 'object') return items;
  var normalizedFilter = convertFilterKeysToApi_(filter);
  return items.filter(function(item) {
    return Object.keys(normalizedFilter).every(function(key) {
      if (!(key in item)) return false;
      return String(item[key]) === String(normalizedFilter[key]);
    });
  });
}

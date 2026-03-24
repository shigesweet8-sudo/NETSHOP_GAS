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

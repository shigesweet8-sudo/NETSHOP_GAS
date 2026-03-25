var STAFF_MASTER_CONFIG = Object.freeze({
  SHEET_NAME: '担当者マスタ',
  HEADERS: Object.freeze(['担当者ID', '担当者名', '表示名', 'ステータス', '作成日', '更新日']),
  STATUS_ACTIVE: 'active',
  STATUS_INACTIVE: 'inactive',
  UI_STATUS_ACTIVE: '有効',
  UI_STATUS_INACTIVE: '無効'
});

function getStaffMasterSheet_(createIfMissing) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet not found');

  var sheet = ss.getSheetByName(STAFF_MASTER_CONFIG.SHEET_NAME);
  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(STAFF_MASTER_CONFIG.SHEET_NAME);
  }
  if (!sheet) return null;

  ensureStaffMasterHeader_(sheet);
  return sheet;
}

function ensureStaffMasterHeader_(sheet) {
  if (!sheet) return;

  var expectedHeaders = STAFF_MASTER_CONFIG.HEADERS.slice();
  var currentHeaders = [];
  if (sheet.getLastRow() >= 1) {
    currentHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0].map(function(value) {
      return String(value || '').trim();
    });
  }

  var headersMatch = expectedHeaders.every(function(header, index) {
    return currentHeaders[index] === header;
  });
  if (!headersMatch) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, expectedHeaders.length)
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setColumnWidths(1, expectedHeaders.length, 160);
  sheet.getRange('E:F').setNumberFormat('yyyy/MM/dd HH:mm');
}

function getStaffMasterSnapshot_() {
  var sheet = getStaffMasterSheet_(true);
  var values = sheet.getDataRange().getValues();
  if (!values.length) {
    return { sheet: sheet, headers: STAFF_MASTER_CONFIG.HEADERS.slice(), rows: [] };
  }

  return {
    sheet: sheet,
    headers: values[0].map(function(value) { return String(value || '').trim(); }),
    rows: values.slice(1)
  };
}

function getStaffHeaderIndexes_(headers) {
  function idx(name) { return headers.indexOf(name); }
  return {
    id: idx('担当者ID'),
    name: idx('担当者名'),
    displayName: idx('表示名'),
    status: idx('ステータス'),
    createdAt: idx('作成日'),
    updatedAt: idx('更新日')
  };
}

function normalizeStoredStaffStatus_(value) {
  return String(value || '').trim().toLowerCase() === STAFF_MASTER_CONFIG.STATUS_INACTIVE
    ? STAFF_MASTER_CONFIG.STATUS_INACTIVE
    : STAFF_MASTER_CONFIG.STATUS_ACTIVE;
}

function getUiStaffStatus_(storedStatus) {
  return storedStatus === STAFF_MASTER_CONFIG.STATUS_INACTIVE
    ? STAFF_MASTER_CONFIG.UI_STATUS_INACTIVE
    : STAFF_MASTER_CONFIG.UI_STATUS_ACTIVE;
}

function buildStaffDisplayName_(staffId, staffName, providedDisplayName) {
  var explicitDisplayName = String(providedDisplayName || '').trim();
  if (explicitDisplayName) return explicitDisplayName;

  var idText = String(staffId || '').trim();
  var nameText = String(staffName || '').trim();
  return [idText, nameText].join(' ').trim() || nameText;
}

function buildPublicStaffFromRow_(headers, row) {
  var indexes = getStaffHeaderIndexes_(headers);
  var staffId = String(row[indexes.id] || '').trim();
  var staffName = String(row[indexes.name] || '').trim();
  var storedStatus = normalizeStoredStaffStatus_(row[indexes.status]);
  var displayName = buildStaffDisplayName_(staffId, staffName, row[indexes.displayName]);

  return {
    staffId: staffId,
    staffName: staffName,
    displayName: displayName,
    status: getUiStaffStatus_(storedStatus),
    staffStatus: storedStatus
  };
}

function findStaffRowIndexById_(rows, indexes, staffId) {
  var targetId = String(staffId || '').trim();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][indexes.id] || '').trim() === targetId) return i;
  }
  return -1;
}

function buildExistingStaffNameMap_(snapshot, indexes) {
  var map = {};
  snapshot.rows.forEach(function(row) {
    var name = String(row[indexes.name] || '').trim();
    if (!name) return;
    map[name] = true;
  });
  return map;
}

function getStaffMaxSequence_(snapshot, indexes) {
  var maxNumber = 0;
  snapshot.rows.forEach(function(row) {
    var value = String(row[indexes.id] || '').trim();
    var match = value.match(/^ST-(\d{4})$/);
    if (!match) return;
    maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
  });
  return maxNumber;
}

function buildNextStaffIds_(count) {
  var safeCount = Number(count || 1);
  if (!isFinite(safeCount) || safeCount < 1) safeCount = 1;
  safeCount = Math.min(Math.floor(safeCount), 10);

  var snapshot = getStaffMasterSnapshot_();
  var indexes = getStaffHeaderIndexes_(snapshot.headers);
  var maxNumber = getStaffMaxSequence_(snapshot, indexes);
  var ids = [];
  for (var i = 1; i <= safeCount; i++) {
    ids.push('ST-' + String(maxNumber + i).padStart(4, '0'));
  }
  return ids;
}

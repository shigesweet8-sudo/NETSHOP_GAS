var STAFF_MASTER_CONFIG = Object.freeze({
  SHEET_NAME: '担当者マスタ',
  HEADERS: Object.freeze(['担当者ID', '担当者名', '利用状態', '備考', '登録日', '更新日']),
  STATUS_ACTIVE: '有効',
  STATUS_INACTIVE: '無効'
});

function getStaffMasterSheet_(createIfMissing) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet not found');

  var sheet = ss.getSheetByName(STAFF_MASTER_CONFIG.SHEET_NAME);
  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(STAFF_MASTER_CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, STAFF_MASTER_CONFIG.HEADERS.length).setValues([STAFF_MASTER_CONFIG.HEADERS.slice()]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, STAFF_MASTER_CONFIG.HEADERS.length)
      .setBackground(CONFIG.COLORS.HEADER_BG)
      .setFontColor(CONFIG.COLORS.HEADER_FG)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setColumnWidths(1, STAFF_MASTER_CONFIG.HEADERS.length, 160);
    sheet.getRange('E:F').setNumberFormat('yyyy/MM/dd HH:mm');
  }
  return sheet;
}

function getStaffMasterSnapshot_() {
  var sheet = getStaffMasterSheet_(false);
  if (!sheet) {
    return { sheet: null, headers: STAFF_MASTER_CONFIG.HEADERS.slice(), rows: [] };
  }
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
    status: idx('利用状態'),
    memo: idx('備考'),
    createdAt: idx('登録日'),
    updatedAt: idx('更新日')
  };
}

function normalizeStaffStatus_(value) {
  var text = String(value || '').trim();
  return text === STAFF_MASTER_CONFIG.STATUS_INACTIVE ? STAFF_MASTER_CONFIG.STATUS_INACTIVE : STAFF_MASTER_CONFIG.STATUS_ACTIVE;
}

function buildPublicStaffFromRow_(headers, row) {
  var indexes = getStaffHeaderIndexes_(headers);
  return {
    staffId: String(row[indexes.id] || '').trim(),
    staffName: String(row[indexes.name] || '').trim(),
    status: normalizeStaffStatus_(row[indexes.status]),
    memo: String(row[indexes.memo] || '').trim(),
    displayName: [String(row[indexes.id] || '').trim(), String(row[indexes.name] || '').trim()].join(' ').trim()
  };
}

function generateStaffId_() {
  var snapshot = getStaffMasterSnapshot_();
  var indexes = getStaffHeaderIndexes_(snapshot.headers);
  var maxNumber = 0;
  snapshot.rows.forEach(function(row) {
    var value = String(row[indexes.id] || '').trim();
    var match = value.match(/^ST-(\d{4})$/);
    if (!match) return;
    var number = parseInt(match[1], 10);
    if (number > maxNumber) maxNumber = number;
  });
  return 'ST-' + String(maxNumber + 1).padStart(4, '0');
}

function listStaffsRaw_(payload) {
  var options = payload && typeof payload === 'object' ? payload : {};
  var includeInactive = !!options.includeInactive;
  var snapshot = getStaffMasterSnapshot_();
  return snapshot.rows.map(function(row) {
    return buildPublicStaffFromRow_(snapshot.headers, row);
  }).filter(function(staff) {
    return includeInactive || staff.status === STAFF_MASTER_CONFIG.STATUS_ACTIVE;
  });
}

function createStaffRaw_(payload) {
  var input = payload && typeof payload === 'object' ? payload : {};
  var staffName = String(input.staffName || input.name || '').trim();
  var memo = String(input.memo || '').trim();
  if (!staffName) {
    throw new Error('担当者名は必須です');
  }

  var sheet = getStaffMasterSheet_(true);
  var snapshot = getStaffMasterSnapshot_();
  var indexes = getStaffHeaderIndexes_(snapshot.headers);
  var duplicated = snapshot.rows.some(function(row) {
    return String(row[indexes.name] || '').trim() === staffName;
  });
  if (duplicated) {
    throw new Error('同じ担当者名が既に登録されています');
  }

  var now = new Date();
  var staffId = generateStaffId_();
  var row = new Array(STAFF_MASTER_CONFIG.HEADERS.length).fill('');
  row[indexes.id] = staffId;
  row[indexes.name] = staffName;
  row[indexes.status] = STAFF_MASTER_CONFIG.STATUS_ACTIVE;
  row[indexes.memo] = memo;
  row[indexes.createdAt] = now;
  row[indexes.updatedAt] = now;

  var targetRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

  return buildPublicStaffFromRow_(snapshot.headers, row);
}

function getStaffDisplayValues_() {
  var staffs = listStaffsRaw_({ includeInactive: false });
  if (staffs.length) {
    return staffs.map(function(staff) { return staff.displayName; });
  }
  if (CONFIG.NETSHOP_MASTERS && Array.isArray(CONFIG.NETSHOP_MASTERS.ASSIGNEE)) {
    return CONFIG.NETSHOP_MASTERS.ASSIGNEE.slice();
  }
  return [];
}

function getStaffs(payload) {
  try {
    var staffs = listStaffsRaw_(payload);
    return buildApiSuccessResponse_({ staffs: staffs, items: staffs }, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('getStaffs error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'GET_STAFFS_FAILED', undefined, {
      extra: { staffs: [], items: [] }
    });
  }
}

function api_getStaffs(payload) {
  return getStaffs(payload);
}

function createStaff(payload) {
  try {
    var staff = createStaffRaw_(payload);
    return buildApiSuccessResponse_({ staff: staff, item: staff }, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('createStaff error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'CREATE_STAFF_FAILED');
  }
}

function api_createStaff(payload) {
  return createStaff(payload);
}

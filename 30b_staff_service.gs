function listStaffsRaw_(payload) {
  var options = payload && typeof payload === 'object' ? payload : {};
  var includeInactive = !!options.includeInactive;
  var snapshot = getStaffMasterSnapshot_();

  return snapshot.rows.map(function(row) {
    return buildPublicStaffFromRow_(snapshot.headers, row);
  }).filter(function(staff) {
    if (!staff.staffName) return false;
    return includeInactive || staff.staffStatus === STAFF_MASTER_CONFIG.STATUS_ACTIVE;
  });
}

function updateStaffValidationList_(values) {
  var sheet = getManagementSheet_();
  if (!sheet) return;

  var uniqueValues = uniqueStringList_(values);
  if (!uniqueValues.length) return;

  var maxDataRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, CONFIG.COLS.STAFF, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(uniqueValues, true)
      .setAllowInvalid(true)
      .build()
  );
}

function normalizeStaffNameList_(value) {
  var rawValues = Array.isArray(value) ? value : String(value || '').split(/\r\n|\n|\r|,/);
  return uniqueStringList_(rawValues.map(function(name) {
    return String(name || '').trim();
  }).filter(function(name) {
    return !!name;
  }));
}

function appendStaffRows_(rows) {
  if (!rows.length) return;

  var sheet = getStaffMasterSheet_(true);
  var targetRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(targetRow, 1, rows.length, rows[0].length).setValues(rows);
}

function updateManagementSheetStaffValues_(oldStaff, newStaff) {
  var sheet = getManagementSheet_();
  if (!sheet) return 0;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  var values = sheet.getRange(2, CONFIG.COLS.STAFF, lastRow - 1, 1).getValues();
  var oldVariants = {};
  [
    oldStaff && oldStaff.displayName,
    oldStaff && oldStaff.staffName,
    oldStaff && oldStaff.staffId
  ].forEach(function(value) {
    var text = String(value || '').trim();
    if (text) oldVariants[text] = true;
  });

  var nextValue = String(newStaff && (newStaff.displayName || newStaff.staffName || newStaff.staffId) || '').trim();
  var changed = 0;
  for (var i = 0; i < values.length; i++) {
    var current = String(values[i][0] || '').trim();
    if (!oldVariants[current]) continue;
    values[i][0] = nextValue;
    changed += 1;
  }
  if (changed) {
    sheet.getRange(2, CONFIG.COLS.STAFF, values.length, 1).setValues(values);
  }
  return changed;
}

function createStaffsRaw_(payload) {
  var input = payload && typeof payload === 'object' ? payload : {};
  var displayNameInput = String(input.displayName || '').trim();
  var staffNames = normalizeStaffNameList_(input.staffNames || input.staffName || input.name);
  if (!staffNames.length) {
    throw new Error('担当者名は必須です');
  }
  if (staffNames.length > 10) {
    throw new Error('担当者の一括登録は10人までです');
  }

  var snapshot = getStaffMasterSnapshot_();
  var indexes = getStaffHeaderIndexes_(snapshot.headers);
  var existingNameMap = buildExistingStaffNameMap_(snapshot, indexes);
  var inputNameMap = {};
  var nextNumber = getStaffMaxSequence_(snapshot, indexes);
  var now = new Date();
  var rows = [];
  var staffs = [];

  staffNames.forEach(function(staffName) {
    if (existingNameMap[staffName] || inputNameMap[staffName]) {
      throw new Error('同じ担当者名が既に登録されています: ' + staffName);
    }
    inputNameMap[staffName] = true;
    nextNumber += 1;

    var staffId = 'ST-' + String(nextNumber).padStart(4, '0');
    var displayName = buildStaffDisplayName_(staffId, staffName, displayNameInput);
    var row = new Array(STAFF_MASTER_CONFIG.HEADERS.length).fill('');
    row[indexes.id] = staffId;
    row[indexes.name] = staffName;
    row[indexes.displayName] = displayName;
    row[indexes.status] = STAFF_MASTER_CONFIG.STATUS_ACTIVE;
    row[indexes.createdAt] = now;
    row[indexes.updatedAt] = now;
    rows.push(row);
    staffs.push(buildPublicStaffFromRow_(snapshot.headers, row));
  });

  appendStaffRows_(rows);
  updateStaffValidationList_(listStaffsRaw_({ includeInactive: false }).map(function(staff) {
    return staff.staffName;
  }));

  return staffs;
}

function createStaffRaw_(payload) {
  return createStaffsRaw_(payload)[0];
}

function getStaffDisplayValues_() {
  return listStaffsRaw_({ includeInactive: false }).map(function(staff) {
    return staff.displayName;
  });
}

function getStaffIdPreviewRaw_(payload) {
  var input = payload && typeof payload === 'object' ? payload : {};
  var count = Number(input.count || 1);
  return {
    ids: buildNextStaffIds_(count),
    count: Math.min(Math.max(Math.floor(isFinite(count) ? count : 1), 1), 10)
  };
}

function updateStaffRaw_(payload) {
  var input = payload && typeof payload === 'object' ? payload : {};
  var staffId = String(input.staffId || input.id || '').trim();
  var staffName = String(input.staffName || input.name || '').trim();
  var displayNameInput = String(input.displayName || '').trim();
  if (!staffId) throw new Error('担当者IDは必須です');
  if (!staffName) throw new Error('担当者名は必須です');

  var snapshot = getStaffMasterSnapshot_();
  var indexes = getStaffHeaderIndexes_(snapshot.headers);
  var rowIndex = findStaffRowIndexById_(snapshot.rows, indexes, staffId);
  if (rowIndex === -1) {
    throw new Error('担当者が見つかりません: ' + staffId);
  }

  var duplicated = snapshot.rows.some(function(row, index) {
    if (index === rowIndex) return false;
    return String(row[indexes.name] || '').trim() === staffName;
  });
  if (duplicated) {
    throw new Error('同じ担当者名が既に登録されています: ' + staffName);
  }

  var row = snapshot.rows[rowIndex].slice();
  var oldStaff = buildPublicStaffFromRow_(snapshot.headers, row);
  row[indexes.name] = staffName;
  row[indexes.displayName] = buildStaffDisplayName_(staffId, staffName, displayNameInput);
  row[indexes.updatedAt] = new Date();

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, row.length).setValues([row]);

  var updatedStaff = buildPublicStaffFromRow_(snapshot.headers, row);
  updateManagementSheetStaffValues_(oldStaff, updatedStaff);
  updateStaffValidationList_(listStaffsRaw_({ includeInactive: false }).map(function(staff) {
    return staff.staffName;
  }));

  return updatedStaff;
}

function deactivateStaffRaw_(payload) {
  var input = payload && typeof payload === 'object' ? payload : {};
  var staffId = String(input.staffId || input.id || '').trim();
  if (!staffId) throw new Error('担当者IDは必須です');

  var snapshot = getStaffMasterSnapshot_();
  var indexes = getStaffHeaderIndexes_(snapshot.headers);
  var rowIndex = findStaffRowIndexById_(snapshot.rows, indexes, staffId);
  if (rowIndex === -1) {
    throw new Error('担当者が見つかりません: ' + staffId);
  }

  var row = snapshot.rows[rowIndex].slice();
  row[indexes.status] = STAFF_MASTER_CONFIG.STATUS_INACTIVE;
  row[indexes.updatedAt] = new Date();
  snapshot.sheet.getRange(rowIndex + 2, 1, 1, row.length).setValues([row]);

  updateStaffValidationList_(listStaffsRaw_({ includeInactive: false }).map(function(staff) {
    return staff.staffName;
  }));

  return buildPublicStaffFromRow_(snapshot.headers, row);
}

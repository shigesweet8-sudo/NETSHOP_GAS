function getExistingStaffCandidates_() {
  var values = getValidationOrDistinctCandidates_(CONFIG.COLS.STAFF);
  if (values.length) return values;
  if (CONFIG.NETSHOP_MASTERS && Array.isArray(CONFIG.NETSHOP_MASTERS.ASSIGNEE)) {
    return uniqueStringList_(CONFIG.NETSHOP_MASTERS.ASSIGNEE);
  }
  return [];
}

function buildSimpleStaffItem_(name) {
  var staffName = String(name || '').trim();
  return {
    staffId: staffName,
    staffName: staffName,
    status: '有効',
    memo: '',
    displayName: staffName
  };
}

function listStaffsRaw_(payload) {
  var options = payload && typeof payload === 'object' ? payload : {};
  var includeBlank = !!options.includeBlank;
  return getExistingStaffCandidates_().filter(function(name) {
    return includeBlank || !!String(name || '').trim();
  }).map(buildSimpleStaffItem_);
}

function updateStaffValidationList_(values) {
  var sheet = getManagementSheet_();
  if (!sheet) throw new Error('商品管理シートが見つかりません');

  var uniqueValues = uniqueStringList_(values);
  if (!uniqueValues.length) {
    throw new Error('担当者候補が空のため更新できません');
  }

  var maxDataRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, CONFIG.COLS.STAFF, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(uniqueValues, true)
      .setAllowInvalid(true)
      .build()
  );
}

function createStaffRaw_(payload) {
  var input = payload && typeof payload === 'object' ? payload : {};
  var staffName = String(input.staffName || input.name || '').trim();
  if (!staffName) {
    throw new Error('担当者名は必須です');
  }

  var currentValues = getExistingStaffCandidates_();
  if (currentValues.some(function(name) { return String(name).trim() === staffName; })) {
    throw new Error('同じ担当者名が既に登録されています');
  }

  currentValues.push(staffName);
  updateStaffValidationList_(currentValues);
  return buildSimpleStaffItem_(staffName);
}

function getStaffDisplayValues_() {
  return listStaffsRaw_({ includeBlank: false }).map(function(staff) {
    return staff.displayName;
  });
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

function getStaffs(payload) {
  try {
    var staffs = listStaffsRaw_(payload);
    return buildApiSuccessResponse_({ staffs: staffs, items: staffs }, {
      copyDataToTopLevel: true
    });
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

function getStaffIdPreview(payload) {
  try {
    return buildApiSuccessResponse_(getStaffIdPreviewRaw_(payload), {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('getStaffIdPreview error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'GET_STAFF_ID_PREVIEW_FAILED', undefined, {
      extra: { ids: [], count: 0 }
    });
  }
}

function api_getStaffIdPreview(payload) {
  return getStaffIdPreview(payload);
}

function createStaff(payload) {
  try {
    var staff = createStaffRaw_(payload);
    return buildApiSuccessResponse_({ staff: staff, item: staff }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('createStaff error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'CREATE_STAFF_FAILED');
  }
}

function api_createStaff(payload) {
  return createStaff(payload);
}

function createStaffBatch(payload) {
  try {
    var staffs = createStaffsRaw_(payload);
    return buildApiSuccessResponse_({
      staffs: staffs,
      items: staffs,
      count: staffs.length
    }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('createStaffBatch error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'CREATE_STAFF_BATCH_FAILED');
  }
}

function api_createStaffBatch(payload) {
  return createStaffBatch(payload);
}

function updateStaff(payload) {
  try {
    var staff = updateStaffRaw_(payload);
    return buildApiSuccessResponse_({ staff: staff, item: staff }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('updateStaff error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'UPDATE_STAFF_FAILED');
  }
}

function api_updateStaff(payload) {
  return updateStaff(payload);
}

function deleteStaff(payload) {
  try {
    var staff = deactivateStaffRaw_(payload);
    return buildApiSuccessResponse_({ staff: staff, item: staff }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('deleteStaff error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'DELETE_STAFF_FAILED');
  }
}

function api_deleteStaff(payload) {
  return deleteStaff(payload);
}

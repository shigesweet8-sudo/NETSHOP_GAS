/**
 * 指定IDの商品を取得する（個人情報列は除外）。
 * @param {string} itemId
 * @returns {Object|null}
 */
function getItemRaw_(itemId) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  return buildPublicItemFromRow_(snapshot.headers, snapshot.rows[rowIndex]);
}

function getItem(itemId) {
  try {
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }
    var item = getItemRaw_(itemId);
    if (!item) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND', undefined, {
        extra: {
          itemId: String(itemId || '')
        }
      });
    }
    return buildApiSuccessResponse_(item, {
      extra: {
        item: item,
        itemId: String(itemId || '')
      }
    });
  } catch (error) {
    Logger.log('getItem error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'GET_ITEM_FAILED');
  }
}

function buildRowFromPayload_(payload, headerResolution) {
  var rowData = new Array(headerResolution.requiredColumnCount).fill('');
  var now = new Date();
  var shopValue = payload.shop || '';
  var itemId = generateId_(shopValue);
  var statusValue = payload.status || CONFIG.STATUS.LISTING;

  rowData[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.id]] = itemId;
  rowData[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.status]] = statusValue;
  rowData[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.date]] = payload.date || now;
  rowData[headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.productRegDate]] =
    payload.productRegDate || (statusValue === CONFIG.STATUS.LISTING ? now : '');

  Object.keys(ITEM_FIELD_TO_HEADER).forEach(function(field) {
    if (field === 'id' || field === 'status' || field === 'date' || field === 'productRegDate') return;
    var header = ITEM_FIELD_TO_HEADER[field];
    var index = headerResolution.indexByHeader[header];
    if (index === undefined) return;
    rowData[index] = payload[field] !== undefined ? payload[field] : rowData[index];
  });

  return {
    itemId: itemId,
    rowData: rowData,
    statusValue: statusValue
  };
}

/**
 * 商品を1件追加する。
 * @param {Object} input
 * @returns {Object|null}
 */
function createItemRaw_(input) {
  var payload = input && typeof input === 'object' ? input : {};
  var sheet = getManagementSheet_();
  if (!sheet) return null;

  var headerResolution = getSheetHeaderResolution_(sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.status,
    ITEM_FIELD_TO_HEADER.date,
    ITEM_FIELD_TO_HEADER.productRegDate
  ]);
  var created = buildRowFromPayload_(payload, headerResolution);
  var nextRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(nextRow, 1, 1, created.rowData.length).setValues([created.rowData]);

  return {
    id: created.itemId,
    row: nextRow,
    status: created.statusValue,
    item: getItemRaw_(created.itemId)
  };
}

function createItem(input) {
  try {
    var created = createItemRaw_(input);
    if (!created) {
      return buildApiErrorResponse_('createItem failed', 'CREATE_ITEM_FAILED');
    }
    return buildApiSuccessResponse_(created, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('createItem error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'CREATE_ITEM_FAILED');
  }
}

function api_createItem(payload) {
  return createItem(payload);
}

/**
 * 指定IDの商品を部分更新し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @param {Object} input
 * @returns {Object|null}
 */
function updateItemRaw_(itemId, input) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [ITEM_FIELD_TO_HEADER.id]);

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = snapshot.rows[rowIndex].slice();
  var payload = input || {};
  var changed = false;

  Object.keys(payload).forEach(function(field) {
    if (field === 'id') return;
    var header = ITEM_FIELD_TO_HEADER[field];
    if (!header) return;

    var headerIndex = headerResolution.indexByHeader[header];
    if (headerIndex === undefined) return;

    rowValues[headerIndex] = payload[field];
    changed = true;
  });

  if (changed) {
    snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  }

  return getItemRaw_(itemId);
}

function updateItem(itemId, input) {
  try {
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }
    var updatedItem = updateItemRaw_(itemId, input);
    if (!updatedItem) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND', undefined, {
        extra: { itemId: String(itemId || '') }
      });
    }
    return buildApiSuccessResponse_({ item: updatedItem, itemId: String(itemId || '') }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('updateItem error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'UPDATE_ITEM_FAILED');
  }
}

function api_updateItem(id, payload) {
  return updateItem(id, payload);
}

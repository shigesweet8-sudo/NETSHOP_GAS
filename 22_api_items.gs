/**
 * NETSHOP item/list APIs.
 */

/**
 * 商品一覧をシートから取得して返却する。
 * @param {Object=} filter
 * @returns {Object[]}
 */
function listItemsRaw_(filter) {
  try {
    var snapshot = getSheetSnapshot_();
    if (!snapshot) return [];
    var items = snapshot.rows.map(function(row) {
      return buildPublicItemFromRow_(snapshot.headers, row);
    });
    return applyFilter_(items, filter);
  } catch (error) {
    Logger.log('listItems error: ' + error);
    return [];
  }
}

function listItems(filter) {
  try {
    var items = listItemsRaw_(filter);
    return buildApiSuccessResponse_(items, {
      extra: {
        items: items
      }
    });
  } catch (error) {
    Logger.log('listItems response error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'LIST_ITEMS_FAILED',
      undefined,
      { extra: { items: [] } }
    );
  }
}

function api_listItems(filter) {
  return listItems(filter);
}

function normalizeSortOrder_(order) {
  var normalized = String(order || '').trim().toLowerCase();
  if (!normalized) return 'asc';
  if (normalized === 'desc' || normalized === 'descending' || normalized === '-1') return 'desc';
  return 'asc';
}

function resolveSortKey_(items, sortKey) {
  var key = String(sortKey || '').trim();
  if (!key) return '';
  if (!items.length) return key;

  if (Object.prototype.hasOwnProperty.call(items[0], key)) {
    return key;
  }

  var headerKey = ITEM_FIELD_TO_HEADER[key];
  if (headerKey && Object.prototype.hasOwnProperty.call(items[0], headerKey)) {
    return headerKey;
  }

  var fieldKey = ITEM_HEADER_TO_FIELD[key];
  if (fieldKey && Object.prototype.hasOwnProperty.call(items[0], fieldKey)) {
    return fieldKey;
  }

  return '';
}

function normalizeComparableValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return {
      type: 'number',
      value: isNaN(value.getTime()) ? null : value.getTime(),
      raw: ''
    };
  }

  if (typeof value === 'number') {
    return {
      type: isFinite(value) ? 'number' : 'empty',
      value: isFinite(value) ? value : null,
      raw: ''
    };
  }

  if (typeof value === 'boolean') {
    return {
      type: 'number',
      value: value ? 1 : 0,
      raw: ''
    };
  }

  if (value === null || value === undefined) {
    return {
      type: 'empty',
      value: null,
      raw: ''
    };
  }

  var text = String(value).trim();
  if (!text) {
    return {
      type: 'empty',
      value: null,
      raw: ''
    };
  }

  var numericText = text.replace(/[\s,，￥¥]/g, '');
  var numericValue = Number(numericText);
  if (!isNaN(numericValue) && numericText !== '') {
    return {
      type: 'number',
      value: numericValue,
      raw: text
    };
  }

  var dateValue = new Date(text);
  if (!isNaN(dateValue.getTime())) {
    return {
      type: 'number',
      value: dateValue.getTime(),
      raw: text
    };
  }

  return {
    type: 'string',
    value: text.toLowerCase(),
    raw: text
  };
}

function compareComparableValues_(left, right) {
  if (left.type === 'empty' && right.type === 'empty') return 0;
  if (left.type === 'empty') return 1;
  if (right.type === 'empty') return -1;

  if (left.type === right.type) {
    if (left.value < right.value) return -1;
    if (left.value > right.value) return 1;
    return 0;
  }

  var leftText = String(left.raw || left.value);
  var rightText = String(right.raw || right.value);
  if (leftText < rightText) return -1;
  if (leftText > rightText) return 1;
  return 0;
}

function sortItemsByKey_(items, sortKey, order) {
  var list = Array.isArray(items) ? items : [];
  if (!list.length) return [];

  var resolvedKey = resolveSortKey_(list, sortKey);
  if (!resolvedKey) return list.slice();

  var direction = normalizeSortOrder_(order) === 'desc' ? -1 : 1;
  var decorated = list.map(function(item, index) {
    return {
      index: index,
      item: item,
      sortValue: normalizeComparableValue_(item[resolvedKey])
    };
  });

  decorated.sort(function(a, b) {
    var compared = compareComparableValues_(a.sortValue, b.sortValue);
    if (compared !== 0) return compared * direction;
    return a.index - b.index;
  });

  return decorated.map(function(entry) {
    return entry.item;
  });
}

function listItemsSorted(filter, sortKey, order) {
  var items = listItemsRaw_(filter);
  return sortItemsByKey_(items, sortKey, order);
}

function api_listItemsSorted(filterOrPayload, sortKey, order) {
  try {
    var filter = filterOrPayload;
    var key = sortKey;
    var sortOrder = order;

    if (
      arguments.length === 1 &&
      filterOrPayload &&
      typeof filterOrPayload === 'object' &&
      !Array.isArray(filterOrPayload) &&
      (
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'filter') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'sortKey') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'key') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'sort') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'orderBy') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'order') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'sortOrder') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'direction') ||
        Object.prototype.hasOwnProperty.call(filterOrPayload, 'action')
      )
    ) {
      filter = filterOrPayload.filter && typeof filterOrPayload.filter === 'object'
        ? filterOrPayload.filter
        : {};
      key = filterOrPayload.sortKey;
      if (key === undefined) key = filterOrPayload.key;
      if (key === undefined) key = filterOrPayload.sort;
      if (key === undefined) key = filterOrPayload.orderBy;
      sortOrder = filterOrPayload.order;
      if (sortOrder === undefined) sortOrder = filterOrPayload.sortOrder;
      if (sortOrder === undefined) sortOrder = filterOrPayload.direction;
    }

    var items = listItemsSorted(filter, key, sortOrder);
    return buildApiSuccessResponse_(items, {
      extra: {
        items: items
      }
    });
  } catch (error) {
    Logger.log('api_listItemsSorted error: ' + error);
    return buildApiErrorResponse_(
      normalizeUiApiErrorMessage_(error),
      'LIST_ITEMS_SORTED_FAILED',
      undefined,
      { extra: { items: [] } }
    );
  }
}

function api_debugContext() {
  var sheet = getManagementSheet_();
  return {
    sheetName: CONFIG.SHEET_NAME,
    sheetExists: !!sheet,
    lastRow: sheet ? sheet.getLastRow() : 0,
    lastColumn: sheet ? sheet.getLastColumn() : 0
  };
}

function debug_listItemsResponse() {
  var response = api_listItems();
  var data = response && response.data;
  var summary = {
    responseType: response === null ? 'null' : Array.isArray(response) ? 'array' : typeof response,
    responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
    ok: response && response.ok,
    errorMessage: response && response.error && response.error.message ? response.error.message : '',
    dataType: data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data,
    dataLength: Array.isArray(data) ? data.length : '',
    itemKeys: Array.isArray(data) && data.length && data[0] && typeof data[0] === 'object' ? Object.keys(data[0]) : []
  };
  Logger.log('debug_listItemsResponse summary: ' + JSON.stringify(summary));
  if (Array.isArray(data) && data.length) {
    Logger.log('debug_listItemsResponse firstItem: ' + JSON.stringify(data[0]));
  }
  return response;
}

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

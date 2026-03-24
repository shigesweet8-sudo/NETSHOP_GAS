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

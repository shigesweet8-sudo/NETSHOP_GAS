function writeUpdatedProfitValues_(sheet, rows, rowIndexes, headerResolution) {
  if (!rowIndexes.length) return;

  var sortedIndexes = rowIndexes.slice().sort(function(a, b) {
    return a - b;
  });
  var profitCol = headerResolution.colByHeader[ITEM_FIELD_TO_HEADER.profit];
  var profitIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.profit];
  var blockStart = sortedIndexes[0];
  var blockValues = [[rows[blockStart][profitIndex]]];

  for (var i = 1; i < sortedIndexes.length; i++) {
    var rowIndex = sortedIndexes[i];
    if (rowIndex === sortedIndexes[i - 1] + 1) {
      blockValues.push([rows[rowIndex][profitIndex]]);
      continue;
    }

    sheet.getRange(blockStart + 2, profitCol, blockValues.length, 1).setValues(blockValues);
    blockStart = rowIndex;
    blockValues = [[rows[rowIndex][profitIndex]]];
  }

  sheet.getRange(blockStart + 2, profitCol, blockValues.length, 1).setValues(blockValues);
}

function buildBulkRecalculateProfitResponse_(ok, message, successItemIds, failureItemIds) {
  var successIds = successItemIds || [];
  var failureIds = failureItemIds || [];
  return {
    ok: ok,
    message: message || '',
    successCount: successIds.length,
    failureCount: failureIds.length,
    successItemIds: successIds,
    failureItemIds: failureIds,
    successIds: successIds,
    failureIds: failureIds
  };
}

function bulkRecalculateProfitRaw_(itemIds) {
  if (!Array.isArray(itemIds)) {
    return buildBulkRecalculateProfitResponse_(false, 'itemIds must be array', [], []);
  }

  var normalizedIds = itemIds.map(function(itemId) {
    return String(itemId || '').trim();
  }).filter(function(itemId) {
    return itemId !== '';
  });

  if (!normalizedIds.length) {
    return buildBulkRecalculateProfitResponse_(false, 'itemIds is required', [], []);
  }

  var snapshot = getSheetSnapshot_();
  if (!snapshot) {
    return buildBulkRecalculateProfitResponse_(false, 'sheet not found', [], normalizedIds.slice());
  }
  if (!snapshot.rows.length) {
    return buildBulkRecalculateProfitResponse_(false, 'no data rows', [], normalizedIds.slice());
  }
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.cost,
    ITEM_FIELD_TO_HEADER.priceFinal,
    ITEM_FIELD_TO_HEADER.fee,
    ITEM_FIELD_TO_HEADER.shipping,
    ITEM_FIELD_TO_HEADER.profit
  ]);

  var successItemIds = [];
  var failureItemIds = [];
  var rowIndexesToUpdate = {};
  var rowIndexMapById = buildRowIndexMapById_(snapshot.rows, snapshot.headers);

  normalizedIds.forEach(function(itemId) {
    var rowIndex = rowIndexMapById[itemId];
    if (rowIndex === undefined) {
      failureItemIds.push(itemId);
      return;
    }

    snapshot.rows[rowIndex] = applyProfitRecalculationToRowValues_(snapshot.rows[rowIndex], headerResolution);
    rowIndexesToUpdate[rowIndex] = true;
    successItemIds.push(itemId);
  });

  var uniqueRowIndexes = Object.keys(rowIndexesToUpdate).map(function(rowIndex) {
    return Number(rowIndex);
  });

  if (uniqueRowIndexes.length) {
    try {
      writeUpdatedProfitValues_(snapshot.sheet, snapshot.rows, uniqueRowIndexes, headerResolution);
    } catch (error) {
      Logger.log('bulkRecalculateProfit error: ' + error);
      return buildBulkRecalculateProfitResponse_(false, String(error), [], normalizedIds.slice());
    }
  }

  return buildBulkRecalculateProfitResponse_(
    failureItemIds.length === 0,
    failureItemIds.length ? 'partial success' : 'success',
    successItemIds,
    failureItemIds
  );
}

function bulkRecalculateProfit(itemIds) {
  try {
    var result = bulkRecalculateProfitRaw_(itemIds);
    if (result.ok) {
      return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
    }
    return buildApiErrorResponse_(result.message || 'bulk recalculate failed', 'BULK_RECALCULATE_FAILED', result, {
      extra: result
    });
  } catch (error) {
    Logger.log('bulkRecalculateProfit response error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_RECALCULATE_FAILED');
  }
}

function api_bulkRecalculateProfit(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    return bulkRecalculateProfit(payload.itemIds);
  } catch (error) {
    Logger.log('api_bulkRecalculateProfit error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_RECALCULATE_FAILED', undefined, {
      extra: buildBulkRecalculateProfitResponse_(false, String(error), [], [])
    });
  }
}

function bulkUpdateStatusRaw_(itemIds, status, memo) {
  if (!Array.isArray(itemIds)) {
    return buildBulkUpdateResponse_(false, 'itemIds must be array', 0, 0, [], []);
  }

  var normalizedIds = itemIds.map(function(itemId) {
    return String(itemId || '').trim();
  }).filter(function(itemId) {
    return itemId !== '';
  });

  if (!normalizedIds.length) {
    return buildBulkUpdateResponse_(false, 'itemIds is required', 0, 0, [], []);
  }

  if (!status) {
    return buildBulkUpdateResponse_(false, 'status is required', 0, normalizedIds.length, [], normalizedIds.slice());
  }

  var statusList = getStatusList_();
  if (statusList.indexOf(status) === -1) {
    return buildBulkUpdateResponse_(false, 'invalid status', 0, normalizedIds.length, [], normalizedIds.slice());
  }

  var snapshot = getSheetSnapshot_();
  if (!snapshot) {
    return buildBulkUpdateResponse_(false, 'sheet not found', 0, normalizedIds.length, [], normalizedIds.slice());
  }
  if (!snapshot.rows.length) {
    return buildBulkUpdateResponse_(false, 'no data rows', 0, normalizedIds.length, [], normalizedIds.slice());
  }
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.status,
    ITEM_FIELD_TO_HEADER.date,
    ITEM_FIELD_TO_HEADER.productRegDate,
    ITEM_FIELD_TO_HEADER.memo
  ]);

  var updatedItemIds = [];
  var failedItemIds = [];
  var rowIndexesToUpdate = {};
  var rowIndexMapById = buildRowIndexMapById_(snapshot.rows, snapshot.headers);

  normalizedIds.forEach(function(itemId) {
    var rowIndex = rowIndexMapById[itemId];
    if (rowIndex === undefined) {
      failedItemIds.push(itemId);
      return;
    }
    snapshot.rows[rowIndex] = applyStatusUpdateToRowValues_(snapshot.rows[rowIndex], status, memo, headerResolution);
    rowIndexesToUpdate[rowIndex] = true;
    updatedItemIds.push(itemId);
  });

  var uniqueRowIndexes = Object.keys(rowIndexesToUpdate).map(function(rowIndex) {
    return Number(rowIndex);
  });

  if (uniqueRowIndexes.length) {
    try {
      writeUpdatedRows_(snapshot.sheet, snapshot.headers.length, snapshot.rows, uniqueRowIndexes);
    } catch (error) {
      Logger.log('bulkUpdateStatus error: ' + error);
      return buildBulkUpdateResponse_(false, String(error), 0, normalizedIds.length, [], normalizedIds.slice());
    }
  }

  return buildBulkUpdateResponse_(
    failedItemIds.length === 0,
    failedItemIds.length ? 'partial success' : 'success',
    updatedItemIds.length,
    failedItemIds.length,
    updatedItemIds,
    failedItemIds
  );
}

function bulkUpdateStatus(itemIds, status, memo) {
  try {
    var result = bulkUpdateStatusRaw_(itemIds, status, memo);
    if (result.ok) {
      return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
    }
    return buildApiErrorResponse_(result.message || 'bulk update failed', 'BULK_UPDATE_STATUS_FAILED', result, {
      extra: result
    });
  } catch (error) {
    Logger.log('bulkUpdateStatus response error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_UPDATE_STATUS_FAILED');
  }
}

function api_bulkUpdateStatus(payload) {
  try {
    payload = payload && typeof payload === 'object' ? payload : {};
    return bulkUpdateStatus(payload.itemIds, payload.status, payload.memo);
  } catch (error) {
    Logger.log('api_bulkUpdateStatus error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'BULK_UPDATE_STATUS_FAILED', undefined, {
      extra: buildBulkUpdateResponse_(false, String(error), 0, 0, [], [])
    });
  }
}

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
 */
function updateItemStatusRaw_(itemId, status, memo) {
  if (!itemId) return null;
  if (CONFIG.STATUS_LIST.indexOf(status) === -1) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.status,
    ITEM_FIELD_TO_HEADER.date,
    ITEM_FIELD_TO_HEADER.productRegDate,
    ITEM_FIELD_TO_HEADER.memo
  ]);

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = applyStatusUpdateToRowValues_(
    snapshot.rows[rowIndex],
    status,
    arguments.length >= 3 ? memo : undefined,
    headerResolution
  );

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  return getItemRaw_(itemId);
}

function updateItemStatus(itemId, status, memo) {
  try {
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }
    if (CONFIG.STATUS_LIST.indexOf(status) === -1) {
      return buildApiErrorResponse_('invalid status', 'INVALID_STATUS', { status: status });
    }
    var item = arguments.length >= 3
      ? updateItemStatusRaw_(itemId, status, memo)
      : updateItemStatusRaw_(itemId, status);
    if (!item) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND');
    }
    return buildApiSuccessResponse_({ item: item, itemId: String(itemId || ''), status: status }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('updateItemStatus error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'UPDATE_STATUS_FAILED');
  }
}

/**
 * 指定IDの商品粗利を再計算し、更新後データ（個人情報除外）を返却する。
 * @param {string} itemId
 * @returns {Object|null}
 */
function recalculateItemProfitRaw_(itemId) {
  if (!itemId) return null;

  var snapshot = getSheetSnapshot_();
  if (!snapshot || !snapshot.rows.length) return null;
  var headerResolution = getSheetHeaderResolution_(snapshot.sheet, [
    ITEM_FIELD_TO_HEADER.id,
    ITEM_FIELD_TO_HEADER.cost,
    ITEM_FIELD_TO_HEADER.priceFinal,
    ITEM_FIELD_TO_HEADER.fee,
    ITEM_FIELD_TO_HEADER.shipping,
    ITEM_FIELD_TO_HEADER.profit
  ]);

  var rowIndex = findRowIndexById_(snapshot.rows, snapshot.headers, itemId);
  if (rowIndex === -1) return null;

  var rowValues = applyProfitRecalculationToRowValues_(snapshot.rows[rowIndex], headerResolution);

  snapshot.sheet.getRange(rowIndex + 2, 1, 1, rowValues.length).setValues([rowValues]);
  return getItemRaw_(itemId);
}

function recalculateItemProfit(itemId) {
  try {
    if (!itemId) {
      return buildApiErrorResponse_('itemId is required', 'ITEM_ID_REQUIRED');
    }
    var item = recalculateItemProfitRaw_(itemId);
    if (!item) {
      return buildApiErrorResponse_('ID not found: ' + itemId, 'ITEM_NOT_FOUND');
    }
    return buildApiSuccessResponse_({ item: item, itemId: String(itemId || '') }, {
      copyDataToTopLevel: true
    });
  } catch (error) {
    Logger.log('recalculateItemProfit error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'RECALCULATE_PROFIT_FAILED');
  }
}

function api_recalculateItemProfit(id) {
  return recalculateItemProfit(id);
}

/**
 * ダッシュボード向け集計値を返す。
 * @param {Object=} filter
 * @returns {{totalCount:number,totalSales:number,totalFee:number,totalShipping:number,totalCost:number,totalProfit:number,profitRate:number}}
 */
function getDashboardSummaryRaw_(filter) {
  var emptySummary = {
    totalCount: 0,
    totalSales: 0,
    totalFee: 0,
    totalShipping: 0,
    totalCost: 0,
    totalProfit: 0,
    profitRate: 0
  };

  function toNumber(value) {
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    if (value === null || value === undefined || value === '') return 0;
    var normalized = String(value).replace(/[\s,，￥¥]/g, '');
    var num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  try {
    var items = listItemsRaw_(filter);
    if (!items.length) return emptySummary;

    var salesKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.PRICE_FINAL - 1]);
    var feeKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.FEE - 1]);
    var shippingKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.SHIPPING - 1]);
    var costKey = toApiFieldKey_(CONFIG.HEADERS[CONFIG.COLS.COST - 1]);

    var summary = {
      totalCount: items.length,
      totalSales: 0,
      totalFee: 0,
      totalShipping: 0,
      totalCost: 0,
      totalProfit: 0,
      profitRate: 0
    };

    items.forEach(function(item) {
      var sale = toNumber(item[salesKey]);
      var fee = toNumber(item[feeKey]);
      var shipping = toNumber(item[shippingKey]);
      var cost = toNumber(item[costKey]);
      summary.totalSales += sale;
      summary.totalFee += fee;
      summary.totalShipping += shipping;
      summary.totalCost += cost;
      summary.totalProfit += sale - fee - shipping - cost;
    });

    summary.profitRate = summary.totalSales ? (summary.totalProfit / summary.totalSales) * 100 : 0;
    return summary;
  } catch (error) {
    Logger.log('getDashboardSummary error: ' + error);
    return emptySummary;
  }
}

function getDashboardSummary(filter) {
  try {
    var summary = getDashboardSummaryRaw_(filter);
    return buildApiSuccessResponse_(summary, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('getDashboardSummary response error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'GET_DASHBOARD_SUMMARY_FAILED');
  }
}

/**
 * 商品一覧をCSV文字列として返す（BOM付きUTF-8）。
 * @param {Object=} filter
 * @returns {string}
 */
function exportCsvRaw_(filter) {
  var items = listItemsRaw_(filter);
  if (!items.length) return '';

  var headers = Object.keys(items[0]);

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  var lines = [headers.map(escapeCsvCell).join(',')];
  items.forEach(function(item) {
    lines.push(headers.map(function(header) {
      return escapeCsvCell(item[header]);
    }).join(','));
  });

  return '\uFEFF' + lines.join('\r\n');
}

function exportCsv(filter) {
  try {
    var csv = exportCsvRaw_(filter);
    var result = {
      csv: csv,
      mimeType: 'text/csv',
      encoding: 'UTF-8',
      hasBom: String(csv || '').indexOf('\uFEFF') === 0
    };
    return buildApiSuccessResponse_(result, { copyDataToTopLevel: true });
  } catch (error) {
    Logger.log('exportCsv error: ' + error);
    return buildApiErrorResponse_(normalizeUiApiErrorMessage_(error), 'EXPORT_CSV_FAILED');
  }
}

function api_testList() {
  var dummyList = [
    { id: 'TEST-001', name: 'テスト商品A', price: 1000 },
    { id: 'TEST-002', name: 'テスト商品B', price: 2000 },
    { id: 'TEST-003', name: 'テスト商品C', price: 3000 }
  ];

  return ContentService
    .createTextOutput(JSON.stringify(dummyList))
    .setMimeType(ContentService.MimeType.JSON);
}

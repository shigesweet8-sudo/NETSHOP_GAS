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


function applyStatusUpdateToRowValues_(rowValues, status, memo, headerResolution) {
  var nextRow = rowValues.slice();
  var now = new Date();
  var statusIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.status];
  var dateIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.date];
  var productRegDateIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.productRegDate];
  var memoIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.memo];

  nextRow[statusIndex] = status;
  nextRow[dateIndex] = now;
  if (status === CONFIG.STATUS.LISTING && !nextRow[productRegDateIndex]) {
    nextRow[productRegDateIndex] = now;
  }
  if (memo !== undefined) {
    var currentMemo = normalizeMemoText_(nextRow[memoIndex]);
    var nextMemo = memo;
    if (
      currentMemo.indexOf(OPERATIONAL_DISABLE_MEMO_PREFIX) !== -1 &&
      normalizeMemoText_(nextMemo).indexOf(OPERATIONAL_DISABLE_MEMO_PREFIX) === -1
    ) {
      var memoWithMarker = normalizeMemoText_(nextMemo);
      nextMemo = memoWithMarker ? (memoWithMarker + '\n' + OPERATIONAL_DISABLE_MEMO_PREFIX) : OPERATIONAL_DISABLE_MEMO_PREFIX;
    }
    nextRow[memoIndex] = nextMemo;
  }
  return nextRow;
}

var OPERATIONAL_DISABLE_HEADER_CANDIDATES = Object.freeze(
  (typeof CONFIG !== 'undefined' &&
    CONFIG.OPERATIONAL_DISABLE &&
    CONFIG.OPERATIONAL_DISABLE.HEADER_CANDIDATES)
    ? CONFIG.OPERATIONAL_DISABLE.HEADER_CANDIDATES.slice()
    : [
      '運用無効',
      '無効化',
      '無効',
      '表示無効',
      '削除フラグ',
      '削除済み'
    ]
);

var OPERATIONAL_DISABLE_MEMO_PREFIX =
  (typeof CONFIG !== 'undefined' &&
    CONFIG.OPERATIONAL_DISABLE &&
    CONFIG.OPERATIONAL_DISABLE.MEMO_PREFIX)
    ? CONFIG.OPERATIONAL_DISABLE.MEMO_PREFIX
    : '[運用無効]';

var ARCHIVE_HEADER_CANDIDATES = Object.freeze(
  (typeof CONFIG !== 'undefined' &&
    CONFIG.ARCHIVE &&
    CONFIG.ARCHIVE.HEADER_CANDIDATES)
    ? CONFIG.ARCHIVE.HEADER_CANDIDATES.slice()
    : [
      'アーカイブ',
      'アーカイブ済み',
      '保管',
      '保管中',
      '退避',
      '退避済み'
    ]
);

var ARCHIVE_MEMO_PREFIX =
  (typeof CONFIG !== 'undefined' &&
    CONFIG.ARCHIVE &&
    CONFIG.ARCHIVE.MEMO_PREFIX)
    ? CONFIG.ARCHIVE.MEMO_PREFIX
    : '[保管]';

function resolveOperationalDisableHeader_(headerResolution) {
  var candidates = OPERATIONAL_DISABLE_HEADER_CANDIDATES;
  for (var i = 0; i < candidates.length; i++) {
    var header = candidates[i];
    if (headerResolution.indexByHeader[header] !== undefined) return header;
  }
  return '';
}

function resolveArchiveHeader_(headerResolution) {
  var candidates = ARCHIVE_HEADER_CANDIDATES;
  for (var i = 0; i < candidates.length; i++) {
    var header = candidates[i];
    if (headerResolution.indexByHeader[header] !== undefined) return header;
  }
  return '';
}

function normalizeMemoText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function appendOperationalDisableMemo_(existingMemo, reason) {
  var currentMemo = normalizeMemoText_(existingMemo);
  var reasonMemo = normalizeMemoText_(reason);
  var segments = [];

  if (currentMemo) segments.push(currentMemo);
  if (currentMemo.indexOf(OPERATIONAL_DISABLE_MEMO_PREFIX) === -1) segments.push(OPERATIONAL_DISABLE_MEMO_PREFIX);
  if (reasonMemo) segments.push(reasonMemo);

  return segments.join('\n');
}

function appendArchiveMemo_(existingMemo, reason) {
  var currentMemo = normalizeMemoText_(existingMemo);
  var reasonMemo = normalizeMemoText_(reason);
  var segments = [];

  if (currentMemo) segments.push(currentMemo);
  if (currentMemo.indexOf(ARCHIVE_MEMO_PREFIX) === -1) segments.push(ARCHIVE_MEMO_PREFIX);
  if (reasonMemo) segments.push(reasonMemo);

  return segments.join('\n');
}

function applyOperationalDisableToRowValues_(rowValues, memo, headerResolution) {
  var nextRow = rowValues.slice();
  var disableHeader = resolveOperationalDisableHeader_(headerResolution);
  var memoIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.memo];

  if (disableHeader) {
    nextRow[headerResolution.indexByHeader[disableHeader]] = true;
    if (memo !== undefined && memoIndex !== undefined) {
      nextRow[memoIndex] = memo;
    }
    return nextRow;
  }

  if (memoIndex !== undefined) {
    nextRow[memoIndex] = appendOperationalDisableMemo_(nextRow[memoIndex], memo);
  }

  return nextRow;
}

function applyArchiveToRowValues_(rowValues, memo, headerResolution) {
  var nextRow = rowValues.slice();
  var archiveHeader = resolveArchiveHeader_(headerResolution);
  var memoIndex = headerResolution.indexByHeader[ITEM_FIELD_TO_HEADER.memo];

  if (archiveHeader) {
    nextRow[headerResolution.indexByHeader[archiveHeader]] = true;
    if (memo !== undefined && memoIndex !== undefined) {
      nextRow[memoIndex] = memo;
    }
    return nextRow;
  }

  if (memoIndex !== undefined) {
    nextRow[memoIndex] = appendArchiveMemo_(nextRow[memoIndex], memo);
  }

  return nextRow;
}

function buildBulkUpdateResponse_(ok, message, successCount, failureCount, updatedItemIds, failedItemIds) {
  var successIds = updatedItemIds || [];
  var failureIds = failedItemIds || [];
  return {
    ok: ok,
    message: message || '',
    successCount: successCount || 0,
    failureCount: failureCount || 0,
    successIds: successIds,
    failureIds: failureIds,
    updatedItemIds: successIds,
    failedItemIds: failureIds
  };
}

function buildRowIndexMapById_(rows, headers) {
  var map = {};
  var idColIndex = headers.indexOf(ITEM_FIELD_TO_HEADER.id);
  if (idColIndex === -1) return map;

  for (var i = 0; i < rows.length; i++) {
    var itemId = String(rows[i][idColIndex] || '').trim();
    if (!itemId) continue;
    map[itemId] = i;
  }
  return map;
}

function writeUpdatedRows_(sheet, headersLength, rows, rowIndexes) {
  if (!rowIndexes.length) return;

  var sortedIndexes = rowIndexes.slice().sort(function(a, b) {
    return a - b;
  });
  var blockStart = sortedIndexes[0];
  var blockValues = [rows[blockStart]];

  for (var i = 1; i < sortedIndexes.length; i++) {
    var rowIndex = sortedIndexes[i];
    if (rowIndex === sortedIndexes[i - 1] + 1) {
      blockValues.push(rows[rowIndex]);
      continue;
    }

    sheet.getRange(blockStart + 2, 1, blockValues.length, headersLength).setValues(blockValues);
    blockStart = rowIndex;
    blockValues = [rows[rowIndex]];
  }

  sheet.getRange(blockStart + 2, 1, blockValues.length, headersLength).setValues(blockValues);
}


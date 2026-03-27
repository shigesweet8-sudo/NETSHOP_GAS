/**
 * 02_triggers.gs
 * onOpen メニュー / トリガー管理
 */

// ==================== onOpen ====================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ensureManagementSheetHeaderIntegrity_();

  ui.createMenu('🛒 ネットショップ管理')
    .addItem('📊 ダッシュボードを更新', 'updateDashboard')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('🔢 計算')
        .addItem('全件 再計算', 'recalculateAll')
        .addItem('選択行 再計算', 'recalculateSelected')
    )
    .addSeparator()
    .addSubMenu(
      ui.createMenu('📤 エクスポート')
        .addItem('月別集計 CSV 出力', 'exportMonthlySummaryCsv')
    )
    .addSeparator()
    .addSubMenu(
      ui.createMenu('🗂️ 整理')
        .addItem('日付で並び替え（新→旧）', 'sortByDateDesc')
        .addSeparator()
        .addItem('キャンセル行を削除', 'deleteCancelledRows')
    )
    .addSeparator()
    .addItem('🏗️ シート初期化', 'createManagementSheet')
    .addToUi();
}

// ==================== onEdit ====================

function onEdit(e) {
  handleManagementSheetEdit_(e, false);
}

function onEditInstallable(e) {
  handleManagementSheetEdit_(e, true);
}

function handleManagementSheetEdit_(e, enableZipAutofill) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;

  var row = range.getRow();
  if (row <= 1) return; // ヘッダー行スキップ

  if (range.getNumRows() > 1 || range.getNumColumns() > 1) return; // 複数セル無視

  var col_ = CONFIG.COLS;
  if (
    range.getColumn() === col_.SHOP &&
    !sheet.getRange(row, col_.ID).getValue()
  ) {
    sheet.getRange(row, col_.ID).setValue(generateId_(range.getValue()));
  }
  if (enableZipAutofill && range.getColumn() === col_.ZIP) {
    autofillAddressFromZip_(sheet, row, range.getDisplayValue());
  }
  var watchCols = [col_.COST, col_.PRICE_FINAL, col_.FEE, col_.SHIPPING, col_.STATUS];
  if (watchCols.indexOf(range.getColumn()) === -1) return;

  if (range.getColumn() === col_.STATUS) {
    var now = new Date();
    sheet.getRange(row, col_.DATE).setValue(now);
    if (
      range.getValue() === CONFIG.STATUS.LISTING &&
      !sheet.getRange(row, col_.PRODUCT_REG_DATE).getValue()
    ) {
      sheet.getRange(row, col_.PRODUCT_REG_DATE).setValue(now);
    }
  }

  recalculateRow_(sheet, row);
  applyManagementRowHighlight_(sheet, row);
}

function autofillAddressFromZip_(sheet, row, zipValue) {
  var address = lookupAddressByZip(zipValue);
  if (!address) return;
  if (sheet.getRange(row, CONFIG.COLS.PREF).getValue() || sheet.getRange(row, CONFIG.COLS.ADDR2).getValue()) return;

  sheet.getRange(row, CONFIG.COLS.PREF).setValue(address.prefecture);
  sheet.getRange(row, CONFIG.COLS.ADDR2).setValue(address.city + address.town);
}

function lookupAddressByZip(zip) {
  try {
    var normalizedZip = String(zip || '').replace(/[-\s]/g, '');
    if (!/^\d{7}$/.test(normalizedZip)) return null;

    var response = UrlFetchApp.fetch('https://zipcloud.ibsnet.co.jp/api/search?zipcode=' + encodeURIComponent(normalizedZip), {
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return null;

    var payload = JSON.parse(response.getContentText());
    if (!payload || payload.status !== 200 || !payload.results || !payload.results.length) return null;

    var result = payload.results[0];
    return {
      prefecture: result.address1 || '',
      city: result.address2 || '',
      town: result.address3 || ''
    };
  } catch (err) {
    return null;
  }
}

// ==================== 自動トリガー設定 ====================

/**
 * 毎日午前0時にダッシュボードを自動更新するトリガーをセット
 */
function setupDailyTrigger() {
  deleteTriggerByFunctionName_('updateDashboard');

  ScriptApp.newTrigger('updateDashboard')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();

  SpreadsheetApp.getUi().alert('✅ 毎日0時にダッシュボード自動更新を設定しました。');
}

/**
 * 既存トリガーをすべて削除
 */
function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });
  SpreadsheetApp.getUi().alert('✅ すべてのトリガーを削除しました。');
}

// ==================== private ====================

function deleteTriggerByFunctionName_(funcName) {
  ScriptApp.getProjectTriggers()
    .filter(function(t) { return t.getHandlerFunction() === funcName; })
    .forEach(function(t) { ScriptApp.deleteTrigger(t); });
}

// Header hardening overrides: keep row 1 frozen and restore it if edited.
function onOpen() {
  ensureManagementSheetHeaderIntegrity_();

  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🛒 ネットショップ管理')
    .addItem('📊 ダッシュボードを更新', 'updateDashboard')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('🧮 再計算')
        .addItem('全件 再計算', 'recalculateAll')
        .addItem('選択行を再計算', 'recalculateSelected')
    )
    .addSeparator()
    .addSubMenu(
      ui.createMenu('📦 エクスポート')
        .addItem('月次集計 CSV 出力', 'exportMonthlySummaryCsv')
    )
    .addSeparator()
    .addSubMenu(
      ui.createMenu('🧹 整理')
        .addItem('日付で並び替え（新しい順）', 'sortByDateDesc')
        .addSeparator()
        .addItem('キャンセル行を削除', 'deleteCancelledRows')
    )
    .addSeparator()
    .addItem('🏗️ シート初期化', 'createManagementSheet')
    .addItem('🔒 ヘッダー固定を再適用', 'hardenManagementSheetHeader')
    .addToUi();
}

function onEdit(e) {
  handleManagementSheetEdit_(e, false);
}

function onEditInstallable(e) {
  handleManagementSheetEdit_(e, true);
}

function handleManagementSheetEdit_(e, enableZipAutofill) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;

  if (range.getRow() === 1 || range.getLastRow() === 1) {
    restoreManagementHeaderIfNeeded_(sheet);
    return;
  }

  var row = range.getRow();
  if (row <= 1) return;
  if (range.getNumRows() > 1 || range.getNumColumns() > 1) return;

  var col_ = CONFIG.COLS;
  if (
    range.getColumn() === col_.SHOP &&
    !sheet.getRange(row, col_.ID).getValue()
  ) {
    sheet.getRange(row, col_.ID).setValue(generateId_(range.getValue()));
  }
  if (enableZipAutofill && range.getColumn() === col_.ZIP) {
    autofillAddressFromZip_(sheet, row, range.getDisplayValue());
  }

  var watchCols = [col_.COST, col_.PRICE_FINAL, col_.FEE, col_.SHIPPING, col_.STATUS];
  if (watchCols.indexOf(range.getColumn()) === -1) return;

  if (range.getColumn() === col_.STATUS) {
    var now = new Date();
    sheet.getRange(row, col_.DATE).setValue(now);
    if (
      range.getValue() === CONFIG.STATUS.LISTING &&
      !sheet.getRange(row, col_.PRODUCT_REG_DATE).getValue()
    ) {
      sheet.getRange(row, col_.PRODUCT_REG_DATE).setValue(now);
    }
  }

  recalculateRow_(sheet, row);
  applyManagementRowHighlight_(sheet, row);
}

function ensureManagementSheetHeaderIntegrity_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;

  restoreManagementHeaderIfNeeded_(sheet);
}

function restoreManagementHeaderIfNeeded_(sheet) {
  var expectedHeaders = CONFIG.HEADERS.slice();
  var headerRange = sheet.getRange(1, 1, 1, expectedHeaders.length);
  var currentHeaders = headerRange.getValues()[0];
  var needsRestore = currentHeaders.length !== expectedHeaders.length ||
    currentHeaders.some(function(value, index) {
      return String(value || '') !== String(expectedHeaders[index] || '');
    });

  if (needsRestore) {
    headerRange.clearContent();
    headerRange.setValues([expectedHeaders]);
  }

  protectManagementSheetForAppOnly_(sheet);
  protectManagementHeaderRow_(sheet);
  sheet.setFrozenRows(1);
}

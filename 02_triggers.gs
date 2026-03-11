/**
 * 02_triggers.gs
 * onOpen メニュー / トリガー管理
 */

// ==================== onOpen ====================
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('🛒 ネットショップ管理')
    .addItem('📊 ダッシュボードを更新', 'updateDashboard')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('📥 データ取込')
        .addItem('メルカリ CSV 取込', 'importMercariData')
        .addItem('ヤフオク CSV 取込', 'importYahooData')
    )
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
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;

  var row = range.getRow();
  if (row <= 1) return; // ヘッダー行スキップ

  if (range.getNumRows() > 1 || range.getNumColumns() > 1) return; // 複数セル無視

  var col_ = CONFIG.COLS;
  var watchCols = [col_.COST, col_.PRICE_FINAL, col_.FEE, col_.SHIPPING, col_.STATUS];
  if (watchCols.indexOf(range.getColumn()) === -1) return;

  recalculateRow_(sheet, row);
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

/**
 * 03_calculation.gs
 * 手数料・利益の計算処理
 */

// ==================== 全件再計算 ====================

/**
 * 管理シートの全データ行を再計算する
 */
function recalculateAll() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    showAlert_('エラー', '「' + CONFIG.SHEET_NAME + '」シートが見つかりません。');
    return;
  }

  var lastRow      = sheet.getLastRow();
  var dataStartRow = 2;
  if (lastRow < dataStartRow) {
    showAlert_('情報', '計算対象のデータがありません。');
    return;
  }

  var col       = CONFIG.COLS;
  var totalRows = lastRow - dataStartRow + 1;

  // 一括読み込み
  var data = sheet.getRange(dataStartRow, 1, totalRows, col.MEMO).getValues();

  var updatedProfit = [];

  data.forEach(function(row) {
    var price    = parseFloat(row[col.COST        - 1]) || 0; // G = 仕入値
    var sale     = parseFloat(row[col.PRICE_FINAL - 1]) || 0; // L = 決済金額
    var fee      = parseFloat(row[col.FEE         - 1]) || 0; // M = サイト利用料
    var shipping = parseFloat(row[col.SHIPPING    - 1]) || 0; // N = 配送料

    var profit = sale - fee - shipping - price;

    updatedProfit.push([profit]);
  });

  // 一括書き込み
  sheet.getRange(dataStartRow, col.PROFIT, totalRows, 1).setValues(updatedProfit);
  // PROFIT_RATE 書込はスキップ中（col.PROFIT_RATE = O列 = 配送元テキスト、実列確定待ち）

  SpreadsheetApp.flush();
  showAlert_('完了', totalRows + ' 件を再計算しました。');
}

// ==================== 選択行再計算 ====================

/**
 * アクティブセルの行だけ再計算する
 */
function recalculateSelected() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    showAlert_('エラー', '「' + CONFIG.SHEET_NAME + '」シートを選択してください。');
    return;
  }

  var row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    showAlert_('エラー', 'データ行を選択してください。');
    return;
  }

  recalculateRow_(sheet, row);
  showAlert_('完了', row + ' 行目を再計算しました。');
}

// ==================== 1行計算 ====================

/**
 * 指定行を計算して書き込む
 * @param {Sheet} sheet
 * @param {number} row
 */
function recalculateRow_(sheet, row) {
  var col = CONFIG.COLS;

  var price    = parseFloat(sheet.getRange(row, col.COST       ).getValue()) || 0; // G = 仕入値
  var sale     = parseFloat(sheet.getRange(row, col.PRICE_FINAL).getValue()) || 0; // L = 決済金額
  var fee      = parseFloat(sheet.getRange(row, col.FEE        ).getValue()) || 0; // M = サイト利用料
  var shipping = parseFloat(sheet.getRange(row, col.SHIPPING   ).getValue()) || 0; // N = 配送料

  var profit = sale - fee - shipping - price;

  sheet.getRange(row, col.PROFIT).setValue(profit);
  // PROFIT_RATE 書込はスキップ中（実列確定待ち）
}

// ==================== 月別集計 ====================

/**
 * 管理シートのデータを月別に集計して返す
 * @returns {Object[]} [{year, month, sales, fee, shipping, cost, profit, count}]
 */
function getMonthlySummary() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return [];

  var lastRow      = sheet.getLastRow();
  var dataStartRow = 2;
  if (lastRow < dataStartRow) return [];

  var col  = CONFIG.COLS;
  var rows = lastRow - dataStartRow + 1;
  var data = sheet.getRange(dataStartRow, 1, rows, col.MEMO).getValues();

  var map = {};
  data.forEach(function(row) {
    var dateVal = row[col.DATE - 1];
    if (!dateVal) return;
    var d   = new Date(dateVal);
    if (isNaN(d.getTime())) return;
    var key = d.getFullYear() + '-' + zeroPad_(d.getMonth() + 1);

    if (!map[key]) {
      map[key] = { year: d.getFullYear(), month: d.getMonth() + 1,
                   sales: 0, fee: 0, shipping: 0, cost: 0, profit: 0, count: 0 };
    }
    var status = row[col.STATUS - 1];
    if (CONFIG.CALC_TARGETS.indexOf(status) === -1) return;

    map[key].sales    += parseFloat(row[col.PRICE_FINAL - 1]) || 0;
    map[key].fee      += parseFloat(row[col.FEE         - 1]) || 0;
    map[key].shipping += parseFloat(row[col.SHIPPING    - 1]) || 0;
    map[key].cost     += parseFloat(row[col.COST        - 1]) || 0;
    map[key].profit   += parseFloat(row[col.PROFIT      - 1]) || 0;
    map[key].count    += 1;
  });

  return Object.keys(map).sort().map(function(k) { return map[k]; });
}

/**
 * ショップ別集計
 * @returns {Object} {shop: {sales, profit, count}}
 */
function getPlatformSummary() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return {};

  var lastRow      = sheet.getLastRow();
  var dataStartRow = 2;
  if (lastRow < dataStartRow) return {};

  var col  = CONFIG.COLS;
  var rows = lastRow - dataStartRow + 1;
  var data = sheet.getRange(dataStartRow, 1, rows, col.MEMO).getValues();

  var map = {};
  data.forEach(function(row) {
    var shop   = row[col.SHOP   - 1] || '不明';
    var status = row[col.STATUS - 1];
    if (CONFIG.CALC_TARGETS.indexOf(status) === -1) return;

    if (!map[shop]) map[shop] = { sales: 0, profit: 0, count: 0 };
    map[shop].sales  += parseFloat(row[col.PRICE_FINAL - 1]) || 0;
    map[shop].profit += parseFloat(row[col.PROFIT      - 1]) || 0;
    map[shop].count  += 1;
  });

  return map;
}

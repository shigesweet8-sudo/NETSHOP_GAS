// feature/issue-2-test ブランチ確認
// GitHub Issue #1 テスト修正
/**
 * 04_dashboard.gs
 * ダッシュボードシートの生成・更新
 */

// ==================== メイン更新 ====================

function updateDashboard() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet_(CONFIG.DASH_SHEET_NAME);

  sheet.clearContents();
  sheet.clearFormats();

  renderTitle_(sheet);
  renderTotalSummary_(sheet, ss);
  renderMonthlySummary_(sheet);
  renderPlatformSummary_(sheet);
  formatDashboard_(sheet);

  SpreadsheetApp.setActiveSheet(sheet);
  showAlert_('完了', 'ダッシュボードを更新しました。');
}

// ==================== タイトル ====================

function renderTitle_(sheet) {
  var now  = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  sheet.getRange('A1').setValue('📊 ネットショップ売上ダッシュボード');
  sheet.getRange('A2').setValue('最終更新: ' + now);
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  sheet.getRange('A2').setFontSize(10).setFontColor('#5f6368');
}

// ==================== 総合集計 ====================

function renderTotalSummary_(sheet, ss) {
  var mgmt = ss.getSheetByName(CONFIG.SHEET_NAME);
  var col  = CONFIG.COLS;

  var totals = { sales: 0, fee: 0, shipping: 0, cost: 0, profit: 0, count: 0 };

  if (mgmt && mgmt.getLastRow() > 1) {
    var rows = mgmt.getLastRow() - 1;
    var data = mgmt.getRange(2, 1, rows, col.MEMO).getValues();
    data.forEach(function(r) {
      if (CONFIG.CALC_TARGETS.indexOf(r[col.STATUS - 1]) === -1) return;
      totals.sales    += parseFloat(r[col.PRICE_FINAL - 1]) || 0;
      totals.fee      += parseFloat(r[col.FEE         - 1]) || 0;
      totals.shipping += parseFloat(r[col.SHIPPING   - 1]) || 0;
      totals.cost     += parseFloat(r[col.COST       - 1]) || 0;
      totals.profit   += parseFloat(r[col.PROFIT     - 1]) || 0;
      totals.count    += 1;
    });
  }

  var startRow = CONFIG.DASHBOARD.SUMMARY_ROW;
  var labels = [
    ['📦 総販売数',  totals.count,    '件'],
    ['💴 総売上',    totals.sales,    '円'],
    ['💸 総手数料',  totals.fee,      '円'],
    ['🚚 総送料',    totals.shipping, '円'],
    ['🏷️ 総仕入',   totals.cost,     '円'],
    ['✅ 総利益',    totals.profit,   '円'],
    ['📈 利益率',    totals.sales > 0 ? (totals.profit / totals.sales * 100).toFixed(1) : 0, '%'],
  ];

  sheet.getRange(startRow, 1).setValue('▶ 総合集計').setFontWeight('bold');
  labels.forEach(function(item, i) {
    var r = startRow + 1 + i;
    sheet.getRange(r, 1).setValue(item[0]);
    sheet.getRange(r, 2).setValue(item[1]);
    sheet.getRange(r, 3).setValue(item[2]);
  });
}

// ==================== 月別集計テーブル ====================

function renderMonthlySummary_(sheet) {
  var monthly  = getMonthlySummary();
  var startRow = CONFIG.DASHBOARD.SUMMARY_ROW + 10;

  sheet.getRange(startRow, 1).setValue('▶ 月別集計').setFontWeight('bold');

  var headers = ['年月', '件数', '売上', '手数料', '送料', '仕入', '利益', '利益率'];
  sheet.getRange(startRow + 1, 1, 1, headers.length).setValues([headers])
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold');

  if (monthly.length === 0) {
    sheet.getRange(startRow + 2, 1).setValue('データなし');
    return;
  }

  var rows = monthly.map(function(m) {
    var label = m.year + '/' + zeroPad_(m.month);
    var rate  = m.sales > 0 ? (m.profit / m.sales * 100).toFixed(1) + '%' : '0%';
    return [label, m.count, m.sales, m.fee, m.shipping, m.cost, m.profit, rate];
  });

  sheet.getRange(startRow + 2, 1, rows.length, headers.length).setValues(rows);

  // 数値フォーマット
  var numCols = [3, 4, 5, 6, 7]; // 売上〜利益
  numCols.forEach(function(c) {
    sheet.getRange(startRow + 2, c, rows.length, 1)
      .setNumberFormat('#,##0');
  });
}

// ==================== プラットフォーム別集計 ====================

function renderPlatformSummary_(sheet) {
  var monthly  = getMonthlySummary(); // 行数計算用
  var baseRow  = CONFIG.DASHBOARD.SUMMARY_ROW + 10 + 3 + Math.max(monthly.length, 1) + 2;

  sheet.getRange(baseRow, 1).setValue('▶ プラットフォーム別').setFontWeight('bold');

  var headers = ['プラットフォーム', '件数', '売上', '利益', '利益率'];
  sheet.getRange(baseRow + 1, 1, 1, headers.length).setValues([headers])
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold');

  var summary = getPlatformSummary();
  var keys    = Object.keys(summary);

  if (keys.length === 0) {
    sheet.getRange(baseRow + 2, 1).setValue('データなし');
    return;
  }

  var rows = keys.map(function(k) {
    var s    = summary[k];
    var rate = s.sales > 0 ? (s.profit / s.sales * 100).toFixed(1) + '%' : '0%';
    return [k, s.count, s.sales, s.profit, rate];
  });

  sheet.getRange(baseRow + 2, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(baseRow + 2, 3, rows.length, 2).setNumberFormat('#,##0');
}

// ==================== 書式設定 ====================

function formatDashboard_(sheet) {
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 80);

  // 総合集計エリア 縞模様
  var s = CONFIG.DASHBOARD.SUMMARY_ROW + 1;
  for (var i = 0; i < 7; i++) {
    if (i % 2 === 0) {
      sheet.getRange(s + i, 1, 1, 3).setBackground(CONFIG.COLORS.ALT_ROW);
    }
  }
  // 利益セルは色付け
  var profitRow = s + 5;
  sheet.getRange(profitRow, 2).setFontColor(CONFIG.COLORS.POSITIVE).setFontWeight('bold');
}

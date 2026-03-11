/**
 * 07_export.gs
 * CSV 出力（Google ドライブへ保存 & ダウンロード用URL表示）
 *
 * ※ GAS はブラウザへの直接ダウンロードができないため、
 *    ドライブに保存してURLをアラートで表示する方式を採用。
 */

// ==================== 管理シート CSV出力 ====================

function exportManagementCsv() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.MANAGEMENT);
  if (!sheet || sheet.getLastRow() <= CONFIG.MGMT_HEADER_ROW) {
    showAlert_('エラー', '管理シートにデータがありません。');
    return;
  }

  var data    = sheet.getDataRange().getValues();
  var csvText = arrayToCsv_(data);
  var fileName = '管理シート_' + formatDateForFile_() + '.csv';

  var url = saveCsvToDrive_(csvText, fileName);
  showAlert_('CSV出力完了', 'ファイルを保存しました。\n\nファイル名: ' + fileName + '\n\n下記URLからダウンロードできます:\n' + url);
}

// ==================== 月別集計 CSV出力 ====================

function exportMonthlySummaryCsv() {
  var monthly = getMonthlySummary();
  if (monthly.length === 0) {
    showAlert_('エラー', 'データがありません。');
    return;
  }

  var headers = ['年月', '件数', '売上', '手数料', '送料', '仕入れ値', '利益', '利益率'];
  var rows    = [headers].concat(monthly.map(function(m) {
    var rate = m.sales > 0 ? (m.profit / m.sales * 100).toFixed(1) + '%' : '0%';
    return [
      m.year + '/' + zeroPad_(m.month),
      m.count,
      m.sales,
      m.fee,
      m.shipping,
      m.cost,
      m.profit,
      rate,
    ];
  }));

  var csvText  = arrayToCsv_(rows);
  var fileName = '月別集計_' + formatDateForFile_() + '.csv';
  var url      = saveCsvToDrive_(csvText, fileName);
  showAlert_('CSV出力完了', 'ファイルを保存しました。\n\nファイル名: ' + fileName + '\n\n' + url);
}

// ==================== プラットフォーム別 CSV出力 ====================

function exportPlatformSummaryCsv() {
  var summary = getPlatformSummary();
  var keys    = Object.keys(summary);
  if (keys.length === 0) {
    showAlert_('エラー', 'データがありません。');
    return;
  }

  var headers = ['プラットフォーム', '件数', '売上', '利益', '利益率'];
  var rows    = [headers].concat(keys.map(function(k) {
    var s    = summary[k];
    var rate = s.sales > 0 ? (s.profit / s.sales * 100).toFixed(1) + '%' : '0%';
    return [k, s.count, s.sales, s.profit, rate];
  }));

  var csvText  = arrayToCsv_(rows);
  var fileName = 'プラットフォーム別_' + formatDateForFile_() + '.csv';
  var url      = saveCsvToDrive_(csvText, fileName);
  showAlert_('CSV出力完了', 'ファイルを保存しました。\n\n' + url);
}

// ==================== 月範囲フィルタ出力 ====================

/**
 * 指定年月の行だけCSV出力
 * @param {number} year
 * @param {number} month
 */
function exportMonthCsv(year, month) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.MANAGEMENT);
  if (!sheet) { showAlert_('エラー', '管理シートが見つかりません。'); return; }

  var col      = CONFIG.MGMT_COL;
  var lastRow  = sheet.getLastRow();
  var hRow     = CONFIG.MGMT_HEADER_ROW;
  if (lastRow <= hRow) { showAlert_('エラー', 'データがありません。'); return; }

  var allData  = sheet.getRange(hRow, 1, lastRow - hRow + 1, col.NOTE).getValues();
  var header   = allData[0];
  var filtered = [header];

  allData.slice(1).forEach(function(row) {
    var d = new Date(row[col.DATE - 1]);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      filtered.push(row);
    }
  });

  if (filtered.length < 2) {
    showAlert_('情報', year + '年' + month + '月のデータはありません。');
    return;
  }

  var csvText  = arrayToCsv_(filtered);
  var fileName = year + zeroPad_(month) + '_売上明細.csv';
  var url      = saveCsvToDrive_(csvText, fileName);
  showAlert_('CSV出力完了', (filtered.length - 1) + '件を出力しました。\n\n' + url);
}

// ==================== helper ====================

/**
 * 2次元配列をCSV文字列へ変換（BOM付きUTF-8でExcel対応）
 */
function arrayToCsv_(data) {
  var lines = data.map(function(row) {
    return row.map(function(cell) {
      var str = cell === null || cell === undefined ? '' : String(cell);
      // カンマ・改行・ダブルクォートを含む場合はクォート
      if (str.indexOf(',') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('"') !== -1) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',');
  });
  // BOM付きUTF-8
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * CSV文字列をGoogle Driveに保存してURLを返す
 */
function saveCsvToDrive_(csvText, fileName) {
  var blob = Utilities.newBlob(csvText, 'text/csv;charset=utf-8', fileName);
  var file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getDownloadUrl();
}

function formatDateForFile_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
}

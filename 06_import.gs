/**
 * 06_import.gs
 * メルカリ / ヤフオク CSV 取込
 *
 * 使い方:
 *   1. メニュー「データ取込」→「メルカリ CSV 取込」を選択
 *   2. ダイアログの指示に従ってCSV内容をテキストエリアに貼り付け
 *   3. 取込実行
 *
 * ※ Google Apps Script はローカルファイルを直接読めないため
 *    CSV テキストをダイアログ経由で貼り付ける方式を採用
 */

// ==================== メルカリ取込 ====================

function importMercariData() {
  var csv = promptCsvInput_('メルカリ CSV 取込', 'メルカリの売上CSVの内容を貼り付けてください');
  if (csv === null) return;

  var rows   = parseCsv_(csv);
  if (rows.length < 2) {
    showAlert_('エラー', 'データが取得できませんでした。CSVフォーマットを確認してください。');
    return;
  }

  var header  = rows[0];
  var dataRows = rows.slice(1);
  var hMap    = buildHeaderMap_(header);
  var mc      = CONFIG.MERCARI_CSV;

  var imported = 0;
  var errors   = [];

  dataRows.forEach(function(row, idx) {
    try {
      if (row.every(function(c) { return c === ''; })) return; // 空行スキップ

      var dateStr   = getCellValue_(row, hMap, mc.TRANSACTION_DATE);
      var itemName  = getCellValue_(row, hMap, mc.ITEM_NAME);
      var salePrice = parseCurrency_(getCellValue_(row, hMap, mc.SALE_PRICE));
      var fee       = parseCurrency_(getCellValue_(row, hMap, mc.FEE));
      var shipping  = parseCurrency_(getCellValue_(row, hMap, mc.SHIPPING));

      if (!dateStr && !itemName) return;

      var feeRate = salePrice > 0 ? fee / salePrice : CONFIG.FEE_RATES.MERCARI;

      appendManagementRow_({
        date      : parseDate_(dateStr),
        platform  : CONFIG.PLATFORMS.MERCARI,
        itemName  : itemName,
        salePrice : salePrice,
        feeRate   : feeRate,
        shipping  : shipping,
        cost      : 0,
        status    : CONFIG.STATUS.COMPLETED,
        note      : 'メルカリ取込',
      });
      imported++;
    } catch (e) {
      errors.push('行' + (idx + 2) + ': ' + e.message);
    }
  });

  SpreadsheetApp.flush();

  var msg = imported + ' 件を取り込みました。';
  if (errors.length) msg += '\n\nエラー:\n' + errors.slice(0, 5).join('\n');
  showAlert_('取込完了', msg);
}

// ==================== ヤフオク取込 ====================

function importYahooData() {
  var csv = promptCsvInput_('ヤフオク CSV 取込', 'ヤフオクの落札CSVの内容を貼り付けてください');
  if (csv === null) return;

  var rows = parseCsv_(csv);
  if (rows.length < 2) {
    showAlert_('エラー', 'データが取得できませんでした。CSVフォーマットを確認してください。');
    return;
  }

  var header   = rows[0];
  var dataRows = rows.slice(1);
  var hMap     = buildHeaderMap_(header);
  var yc       = CONFIG.YAHOO_CSV;

  var imported = 0;
  var errors   = [];

  dataRows.forEach(function(row, idx) {
    try {
      if (row.every(function(c) { return c === ''; })) return;

      var dateStr   = getCellValue_(row, hMap, yc.END_DATE);
      var itemName  = getCellValue_(row, hMap, yc.TITLE);
      var salePrice = parseCurrency_(getCellValue_(row, hMap, yc.SOLD_PRICE));
      var fee       = parseCurrency_(getCellValue_(row, hMap, yc.FEE));
      var shipping  = parseCurrency_(getCellValue_(row, hMap, yc.SHIPPING));

      if (!dateStr && !itemName) return;

      var feeRate = salePrice > 0 ? fee / salePrice : CONFIG.FEE_RATES.YAHOO;

      appendManagementRow_({
        date      : parseDate_(dateStr),
        platform  : CONFIG.PLATFORMS.YAHOO,
        itemName  : itemName,
        salePrice : salePrice,
        feeRate   : feeRate,
        shipping  : shipping,
        cost      : 0,
        status    : CONFIG.STATUS.COMPLETED,
        note      : 'ヤフオク取込',
      });
      imported++;
    } catch (e) {
      errors.push('行' + (idx + 2) + ': ' + e.message);
    }
  });

  SpreadsheetApp.flush();

  var msg = imported + ' 件を取り込みました。';
  if (errors.length) msg += '\n\nエラー:\n' + errors.slice(0, 5).join('\n');
  showAlert_('取込完了', msg);
}

// ==================== RAWシートからの取込 ====================

/**
 * RAWシート（貼り付け済み）から管理シートへ変換取込
 * @param {string} rawSheetName - CONFIG.SHEETS.MERCARI_RAW など
 * @param {string} platform
 */
function importFromRawSheet_(rawSheetName, platform) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var raw = ss.getSheetByName(rawSheetName);
  if (!raw || raw.getLastRow() < 2) {
    showAlert_('エラー', rawSheetName + ' にデータがありません。');
    return;
  }

  var data   = raw.getDataRange().getValues();
  var header = data[0];
  var hMap   = buildHeaderMap_(header);

  var csvKeys = platform === CONFIG.PLATFORMS.MERCARI ? CONFIG.MERCARI_CSV : CONFIG.YAHOO_CSV;
  var dateKey   = platform === CONFIG.PLATFORMS.MERCARI ? csvKeys.TRANSACTION_DATE : csvKeys.END_DATE;
  var nameKey   = platform === CONFIG.PLATFORMS.MERCARI ? csvKeys.ITEM_NAME : csvKeys.TITLE;
  var priceKey  = platform === CONFIG.PLATFORMS.MERCARI ? csvKeys.SALE_PRICE : csvKeys.SOLD_PRICE;

  var imported = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row.every(function(c) { return c === ''; })) continue;

    var salePrice = parseCurrency_(String(getCellValue_(row, hMap, priceKey)));
    var fee       = parseCurrency_(String(getCellValue_(row, hMap, csvKeys.FEE)));
    var shipping  = parseCurrency_(String(getCellValue_(row, hMap, csvKeys.SHIPPING)));
    var feeRate   = salePrice > 0 ? fee / salePrice : getFeeRate_(platform);

    appendManagementRow_({
      date      : parseDate_(String(getCellValue_(row, hMap, dateKey))),
      platform  : platform,
      itemName  : getCellValue_(row, hMap, nameKey),
      salePrice : salePrice,
      feeRate   : feeRate,
      shipping  : shipping,
      cost      : 0,
      status    : CONFIG.STATUS.COMPLETED,
      note      : rawSheetName + '取込',
    });
    imported++;
  }

  SpreadsheetApp.flush();
  showAlert_('完了', rawSheetName + ' から ' + imported + ' 件を取り込みました。');
}

// ==================== CSV入力ダイアログ ====================

function promptCsvInput_(title, message) {
  var ui  = SpreadsheetApp.getUi();
  var res = ui.prompt(title, message + '\n（ヘッダー行を含めて貼り付け）', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return null;
  var text = res.getResponseText().trim();
  if (!text) return null;
  return text;
}

// ==================== CSV パース ====================

/**
 * CSV文字列を2次元配列に変換（ダブルクォート対応）
 * @param {string} csv
 * @returns {string[][]}
 */
function parseCsv_(csv) {
  // 改行コード正規化
  csv = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  var lines  = [];
  var inQuote = false;
  var current = '';
  var rows    = [];
  var cells   = [];

  for (var i = 0; i < csv.length; i++) {
    var ch = csv[i];
    if (ch === '"') {
      if (inQuote && csv[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      cells.push(current.trim());
      current = '';
    } else if (ch === '\n' && !inQuote) {
      cells.push(current.trim());
      rows.push(cells);
      cells   = [];
      current = '';
    } else {
      current += ch;
    }
  }
  if (current || cells.length) {
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

// ==================== helper ====================

function buildHeaderMap_(header) {
  var map = {};
  header.forEach(function(h, i) { map[h.trim()] = i; });
  return map;
}

function getCellValue_(row, hMap, key) {
  var idx = hMap[key];
  return idx !== undefined ? String(row[idx] || '').trim() : '';
}

function parseCurrency_(str) {
  // "¥1,234" "1234円" など
  return parseFloat(str.replace(/[¥,円\s]/g, '')) || 0;
}

function parseDate_(str) {
  if (!str) return new Date();
  // "2024/01/15" "2024-01-15" "2024年1月15日"
  var clean = str.replace(/年/g, '/').replace(/月/g, '/').replace(/日/g, '').replace(/-/g, '/');
  var d = new Date(clean);
  return isNaN(d.getTime()) ? new Date() : d;
}

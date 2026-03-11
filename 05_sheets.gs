/**
 * 05_sheets.gs
 * シート初期化・構造管理
 */

// ==================== 管理シート作成 ====================

/**
 * 管理シートを初期化する（既存データは保持して再フォーマット）
 */
function createManagementSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var ui    = SpreadsheetApp.getUi();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (sheet) {
    var res = ui.alert(
      '確認',
      CONFIG.SHEET_NAME + ' は既に存在します。\nヘッダーを再作成しますか？（データは保持されます）',
      ui.ButtonSet.YES_NO
    );
    if (res !== ui.Button.YES) return;
  } else {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME, 0);
  }

  writeManagementHeader_(sheet);
  applyManagementFormat_(sheet);
  redrawManagementSheet_(sheet);
  var shipFromRange = sheet.getRange(2, 15, Math.max(sheet.getMaxRows() - 1, 1), 1);
  var shipFromValues = shipFromRange.getValues().map(function(row) {
    var value = row[0];
    if (typeof value === 'number') return [''];
    if (typeof value === 'string' && /^0(?:\.0+)?%?$/.test(value.trim())) return [''];
    return [value];
  });
  shipFromRange.setValues(shipFromValues);
  sheet.getRange('O:O').setNumberFormat('@');
  shipFromRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['自社', '外部依頼'], true)
      .build()
  );
  ss.setActiveSheet(sheet);
  showAlert_('完了', '管理シートを初期化しました。');
}

// ==================== ヘッダー書き込み ====================

function writeManagementHeader_(sheet) {
  sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS.slice()]);
}

// ==================== フォーマット適用 ====================

function applyManagementFormat_(sheet) {
  var col         = CONFIG.COLS;
  var maxCol      = CONFIG.HEADERS.length;
  var maxDataRows = sheet.getMaxRows() - 1;
  var colors      = CONFIG.COLORS;

  // ヘッダー行
  sheet.getRange(1, 1, 1, maxCol)
    .setBackground(colors.HEADER_BG)
    .setFontColor(colors.HEADER_FG)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // 数値列フォーマット
  [col.PRICE_FINAL, col.FEE, col.SHIPPING, col.COST, col.PROFIT].forEach(function(c) {
    sheet.getRange(2, c, maxDataRows, 1).setNumberFormat('#,##0');
  });
  sheet.getRange(2, col.PROFIT_RATE, maxDataRows, 1).setNumberFormat('0.0%');
  sheet.getRange(2, col.DATE,        maxDataRows, 1).setNumberFormat('yyyy/MM/dd');

  // ヘッダー行を固定
  sheet.setFrozenRows(1);
}

// ==================== データ追記 ====================

/**
 * 管理シートに1行追記する
 * @param {Object} record - {date, shop, itemName, priceFinal, fee, shipping, cost, status, memo, orderId, qty}
 *                          ※ 旧キー salePrice/note/platform も互換で受け付ける
 * @returns {number} 書き込んだ行番号
 */
function redrawManagementSheet_(sheet) {
  var lastRow = getManagementDataLastRow_(sheet);
  if (lastRow <= 1) return;
  var colCount      = CONFIG.HEADERS.length;
  var rowCount      = lastRow - 1;
  var colors        = CONFIG.COLORS;
  var white         = colors.BASE_ROW_WHITE || '#ffffff';
  var alt           = colors.ALT_ROW || white;
  var dataValues    = sheet.getRange(2, 1, rowCount, colCount).getValues();
  var backgrounds   = [];

  for (var row = 2; row <= lastRow; row++) {
    var rowValues = dataValues[row - 2];
    var status = rowValues[CONFIG.COLS.STATUS - 1];
    var bg = row % 2 === 0 ? white : alt;
    var rowBackgrounds = new Array(colCount).fill(bg);
    var rule = getManagementHighlightRule_(status);

    if (rule) {
      rule.columns.forEach(function(column) {
        rowBackgrounds[column - 1] = isManagementBlankValue_(rowValues[column - 1])
          ? rule.background
          : '#ffffff';
      });
    }
    backgrounds.push(rowBackgrounds);
  }

  sheet.getRange(2, 1, rowCount, colCount).setBackgrounds(backgrounds);
}

function applyManagementRowStyle_(sheet, row) {
  applyManagementRowBaseStyle_(sheet, row);
  applyManagementRowHighlight_(sheet, row);
}

function applyManagementRowBaseStyle_(sheet, row) {
  var colors = CONFIG.COLORS;
  var white  = colors.BASE_ROW_WHITE || '#ffffff';
  var alt    = colors.ALT_ROW || white;
  var bg     = row % 2 === 0 ? white : alt;

  sheet.getRange(row, 1, 1, CONFIG.HEADERS.length).setBackground(bg);
}

function applyManagementRowHighlight_(sheet, row) {
  var col = CONFIG.COLS;
  var colors = CONFIG.COLORS;

  var white = colors.BASE_ROW_WHITE || '#ffffff';
  var alt   = colors.ALT_ROW || white;
  var bg    = row % 2 === 0 ? white : alt;

  var status = sheet.getRange(row, col.STATUS).getValue();
  var rowValues = sheet.getRange(row, 1, 1, CONFIG.HEADERS.length).getValues()[0];

  var rowBackgrounds = new Array(CONFIG.HEADERS.length).fill(bg);

  var rule = getManagementHighlightRule_(status);

  if (rule) {
    rule.columns.forEach(function(column) {
      if (isManagementBlankValue_(rowValues[column - 1])) {
        rowBackgrounds[column - 1] = rule.background;
      }
    });
  }

  sheet.getRange(row, 1, 1, CONFIG.HEADERS.length).setBackgrounds([rowBackgrounds]);
}

function getManagementHighlightRule_(status) {
  var col = CONFIG.COLS;
  var highlightColor = CONFIG.COLORS.PRODUCT_REG_HIGHLIGHT || '#fff2cc';

  if (status === '📝商品登録') {
    return {
      background: highlightColor,
      columns: [
        col.ID,
        col.STAFF,
        col.PRODUCT_REG_DATE,
        col.SHOP,
        col.ITEM_NAME,
        col.STORAGE,
        col.QTY
      ]
    };
  }

  if (status === '💰決済完了') {
    return {
      background: '#e2efda',
      columns: [
        col.COST,
        col.PRICE_FINAL,
        col.FEE,
        col.SHIPPING
      ]
    };
  }

  if (status === '📦発送準備中') {
    return {
      background: '#e4dfec',
      columns: [
        col.SHIP_FROM,
        col.CUSTOMER,
        col.CARRIER,
        col.ZIP,
        col.PREF,
        col.ADDR2,
        col.ADDR3,
        col.PHONE
      ]
    };
  }

  return null;
}

function getManagementDataLastRow_(sheet) {
  return sheet.getLastRow();
}

function getManagementRequiredWarningColumns_(rowValues) {
  var col = CONFIG.COLS;
  var requiredColumns = [
    col.ID,
    col.STAFF,
    col.PRODUCT_REG_DATE,
    col.SHOP,
    col.ITEM_NAME,
    col.STORAGE,
    col.QTY
  ];

  return requiredColumns.filter(function(column) {
    return isManagementBlankValue_(rowValues[column - 1]);
  });
}

function isManagementBlankValue_(value) {
  if (value === null || value === '') return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * 管理シートに1行追加する
 * @param {Object} record - {date, shop, itemName, priceFinal, fee, shipping, cost, status, memo, orderId, qty}
 * @returns {number} 書き込んだ行番号
 */
function appendManagementRow_(record) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('「' + CONFIG.SHEET_NAME + '」シートが見つかりません');

  var col     = CONFIG.COLS;
  var nextRow = Math.max(sheet.getLastRow() + 1, 2);
  var id      = generateId_(record.shop || record.platform || '');

  var salePrice  = parseFloat(record.priceFinal || record.salePrice) || 0;
  var fee        = parseFloat(record.fee)        || 0;
  var shipping   = parseFloat(record.shipping)   || 0;
  var cost       = parseFloat(record.cost)       || 0;
  var profit     = salePrice - fee - shipping - cost;
  var profitRate = salePrice > 0 ? profit / salePrice : 0;

  var rowData = new Array(CONFIG.HEADERS.length).fill('');

  rowData[col.IMPORTED_AT - 1] = new Date();
  rowData[col.ID          - 1] = id;
  rowData[col.DATE        - 1] = record.date     || new Date();
  rowData[col.STATUS      - 1] = record.status   || CONFIG.STATUS.LISTING;
  rowData[col.SHOP        - 1] = record.shop || record.platform || '';
  if (col.ORDER_ID !== col.ID) {
    rowData[col.ORDER_ID  - 1] = record.orderId  || '';
  }
  rowData[col.ITEM_NAME   - 1] = record.itemName || '';
  rowData[col.QTY         - 1] = record.qty      || 1;
  rowData[col.COST        - 1] = cost;
  rowData[col.PRICE_FINAL - 1] = salePrice;
  rowData[col.FEE         - 1] = fee;
  rowData[col.SHIPPING    - 1] = shipping;
  rowData[col.PROFIT      - 1] = profit;
  rowData[col.PROFIT_RATE - 1] = profitRate;
  rowData[col.MEMO        - 1] = record.memo || record.note || '';

  sheet.getRange(nextRow, 1, 1, CONFIG.HEADERS.length).setValues([rowData]);
  applyManagementRowStyle_(sheet, nextRow);

  return nextRow;
}

// ==================== シート取得ユーティリティ ====================

/**
 * シートを名前で取得、なければ作成する
 * @param {string} name
 * @returns {Sheet}
 */
function getOrCreateSheet_(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

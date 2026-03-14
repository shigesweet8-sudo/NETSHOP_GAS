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
  var col   = CONFIG.COLS;

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
  // applyManagementFormat_(sheet); // 書式処理は applyManagementRowStyle_ に統一
  redrawManagementSheet_(sheet);
  var maxDataRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, col.STATUS, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['商品登録', '出品中', '値段交渉中', '決済完了', '発送準備中', '発送完了', '取引完了', 'キャンセル'], true)
      .setAllowInvalid(true)
      .build()
  );
  sheet.getRange(2, col.STAFF, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['長谷川', '小園', '堀田', '柏原', '本田', '伊藤', '宮廻', '体験者'], true)
      .setAllowInvalid(true)
      .build()
  );
  sheet.getRange(2, col.SHOP, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['メルカリ(Cappa)', 'メルカリ(どすこい)', 'メルカリShops', 'ヤフオク(Cappa)', 'ヤフオク(海坊主)', 'Yahoo!Shop', 'Amazon'], true)
      .setAllowInvalid(true)
      .build()
  );
  var shipFromRange = sheet.getRange(2, col.SHIP_FROM, maxDataRows, 1);
  var shipFromValues = shipFromRange.getValues().map(function(row) {
    var value = row[0];
    if (typeof value === 'number') return [''];
    if (typeof value === 'string' && /^0(?:\.0+)?%?$/.test(value.trim())) return [''];
    return [value];
  });
  shipFromRange.setValues(shipFromValues);
  sheet.getRange(2, col.SHIP_FROM, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['自社', '外部依頼', '手打ち'], true)
      .setAllowInvalid(true)
      .build()
  );
  sheet.getRange(2, col.CARRIER, maxDataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['ヤマト運輸', '佐川急便', '日本郵便'], true)
      .setAllowInvalid(true)
      .build()
  );
  sheet.getRange('P:P').setNumberFormat('@');
  ss.setActiveSheet(sheet);
  showAlert_('完了', '管理シートを初期化しました。');
}

// ==================== ヘッダー書き込み ====================

function writeManagementHeader_(sheet) {
  sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS.slice()]);
}

function migrateIconStatusesToPlainText() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('「' + CONFIG.SHEET_NAME + '」シートが見つかりません');

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('status migration: no data rows');
    return;
  }

  var statusCol = CONFIG.COLS.STATUS;
  var values = sheet.getRange(2, statusCol, lastRow - 1, 1).getValues();
  var statusMap = {
    '📝商品登録': '商品登録',
    '📦出品中': '出品中',
    '🌐出品中': '出品中',
    '🤝値段交渉中': '値段交渉中',
    '💬値段交渉中': '値段交渉中',
    '💰決済完了': '決済完了',
    '🚚発送準備中': '発送準備中',
    '📦発送準備中': '発送準備中',
    '✅発送完了': '発送完了',
    '🚚発送完了': '発送完了',
    '🎉取引完了': '取引完了',
    '🧾取引完了': '取引完了',
    '▩取引完了': '取引完了',
    '❌キャンセル': 'キャンセル'
  };
  var currentStatuses = {
    '商品登録': true,
    '出品中': true,
    '値段交渉中': true,
    '決済完了': true,
    '発送準備中': true,
    '発送完了': true,
    '取引完了': true,
    'キャンセル': true
  };
  var changedCount = 0;
  var unsupported = {};
  var suffixStatusMap = {
    '出品中': '出品中',
    '値段交渉中': '値段交渉中',
    '発送準備中': '発送準備中',
    '発送完了': '発送完了',
    '取引完了': '取引完了'
  };

  values.forEach(function(row, index) {
    var value = row[0];
    if (statusMap[value]) {
      sheet.getRange(index + 2, statusCol).setValue(statusMap[value]);
      changedCount += 1;
      return;
    }
    var normalizedStatus = Object.keys(suffixStatusMap).find(function(suffix) {
      return value && value !== suffix && String(value).slice(-suffix.length) === suffix;
    });
    if (normalizedStatus) {
      sheet.getRange(index + 2, statusCol).setValue(suffixStatusMap[normalizedStatus]);
      changedCount += 1;
      return;
    }
    if (value && !currentStatuses[value]) {
      unsupported[value] = (unsupported[value] || 0) + 1;
    }
  });

  Logger.log('status migration: changed=%s', changedCount);
  Object.keys(unsupported).sort().forEach(function(status) {
    Logger.log('status migration: unsupported="%s" count=%s', status, unsupported[status]);
  });
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
      if (rule.fillWholeRow) {
        rowBackgrounds = new Array(colCount).fill(rule.background);
      } else {
        (rule.previousColumns || []).forEach(function(column) {
          if (isManagementBlankValue_(rowValues[column - 1])) {
            rowBackgrounds[column - 1] = rule.errorBackground;
          }
        });
        rule.columns.forEach(function(column) {
          if (isManagementBlankValue_(rowValues[column - 1])) {
            rowBackgrounds[column - 1] = rule.background;
          }
        });
      }
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
    if (rule.fillWholeRow) {
      rowBackgrounds = new Array(CONFIG.HEADERS.length).fill(rule.background);
    } else {
      (rule.previousColumns || []).forEach(function(column) {
        if (isManagementBlankValue_(rowValues[column - 1])) {
          rowBackgrounds[column - 1] = rule.errorBackground;
        }
      });
      rule.columns.forEach(function(column) {
        if (isManagementBlankValue_(rowValues[column - 1])) {
          rowBackgrounds[column - 1] = rule.background;
        }
      });
    }
  }

  sheet.getRange(row, 1, 1, CONFIG.HEADERS.length).setBackgrounds([rowBackgrounds]);
}

function getManagementHighlightRule_(status) {
  var col = CONFIG.COLS;

  if (status === CONFIG.STATUS.LISTING) {
    return {
      columns: [
        col.ID,
        col.STAFF,
        col.PRODUCT_REG_DATE,
        col.SHOP,
        col.ITEM_NAME,
        col.STORAGE,
        col.QTY
      ],
      background: '#FFF2CC',
      previousColumns: [],
      errorBackground: '#F4CCCC'
    };
  }

  if (status === CONFIG.STATUS.ON_SALE) {
    return {
      previousColumns: [
        col.ID,
        col.STAFF,
        col.PRODUCT_REG_DATE,
        col.SHOP,
        col.ITEM_NAME,
        col.STORAGE,
        col.QTY
      ],
      columns: [
        col.COST,
        col.LIST_PRICE
      ],
      background: '#FFF2CC',
      errorBackground: '#F4CCCC'
    };
  }

  if (status === CONFIG.STATUS.NEGOTIATING) {
    return {
      previousColumns: [
        col.ID,
        col.STAFF,
        col.PRODUCT_REG_DATE,
        col.SHOP,
        col.ITEM_NAME,
        col.STORAGE,
        col.QTY,
        col.COST,
        col.LIST_PRICE
      ],
      columns: [col.NEGOTIATED_PRICE],
      background: '#FFF2CC',
      errorBackground: '#F4CCCC'
    };
  }

  if (status === CONFIG.STATUS.PAID) {
    return {
      previousColumns: [
        col.ID,
        col.STAFF,
        col.PRODUCT_REG_DATE,
        col.SHOP,
        col.ITEM_NAME,
        col.STORAGE,
        col.QTY,
        col.COST,
        col.LIST_PRICE,
        col.NEGOTIATED_PRICE
      ],
      columns: [
        col.PRICE_FINAL,
        col.FEE,
        col.SHIPPING
      ],
      background: '#FFF2CC',
      errorBackground: '#F4CCCC'
    };
  }

  if (status === CONFIG.STATUS.PREPARING) {
    return {
      previousColumns: [
        col.ID,
        col.STAFF,
        col.PRODUCT_REG_DATE,
        col.SHOP,
        col.ITEM_NAME,
        col.STORAGE,
        col.QTY,
        col.COST,
        col.LIST_PRICE,
        col.NEGOTIATED_PRICE,
        col.PRICE_FINAL,
        col.FEE,
        col.SHIPPING
      ],
      columns: [
        col.SHIP_FROM,
        col.CUSTOMER,
        col.CARRIER,
        col.TRACKING,
        col.ZIP,
        col.PREF,
        col.ADDR2,
        col.ADDR3,
        col.PHONE
      ],
      background: '#FFF2CC',
      errorBackground: '#F4CCCC'
    };
  }

  if (status === CONFIG.STATUS.SHIPPED) {
    return {
      columns: [],
      background: '#E8F0FE',
      fillWholeRow: true
    };
  }

  if (status === CONFIG.STATUS.COMPLETED) {
    return {
      columns: [],
      background: '#E6F4EA',
      fillWholeRow: true
    };
  }

  if (status === CONFIG.STATUS.CANCEL) {
    return {
      columns: [],
      background: '#EAD1F2',
      fillWholeRow: true
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

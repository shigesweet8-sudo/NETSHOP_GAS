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

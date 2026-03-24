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


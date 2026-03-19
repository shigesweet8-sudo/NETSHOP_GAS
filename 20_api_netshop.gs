/**
 * 商品一覧をシートから取得して返却する。
 * @param {Object=} filter
 * @returns {Object[]}
 */
function listItems(filter) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("Spreadsheet Name: " + ss.getName());
    if (!ss) return [];

    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    Logger.log("Sheet Exists: " + (sheet ? "YES" : "NO"));
    if (sheet) {
      Logger.log("LastRow: " + sheet.getLastRow());
    }
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow === 0 || lastColumn === 0) return [];

    var rows = sheet.getDataRange().getValues();
    if (!rows.length) return [];

    var headers = rows[0].map(function(header) {
      return String(header || "").trim();
    });
    var dataRows = rows.slice(1);
    var excludedHeaders = {
      "購入者名": true,
      "郵便番号": true,
      "都道府県": true,
      "住所2(地番)": true,
      "住所3(建物名)": true,
      "電話番号": true
    };
    var targetIndexes = [];

    headers.forEach(function(header, index) {
      if (!excludedHeaders[header]) {
        targetIndexes.push(index);
      }
    });

    var items = dataRows.map(function(row) {
      var item = {};
      targetIndexes.forEach(function(index) {
        item[headers[index]] = row[index];
      });
      return item;
    });

    if (filter && typeof filter === "object") {
      items = items.filter(function(item) {
        return Object.keys(filter).every(function(key) {
          if (!(key in item)) return false;
          return item[key] === filter[key];
        });
      });
    }

    Logger.log(JSON.stringify(items));
    return items;
  } catch (error) {
    Logger.log('listItems error: ' + error);
    return [];
  }
}

function getItem(itemId) {
  var normalizedItemId = String(itemId || "").trim();
  if (!normalizedItemId) return null;

  var items = listItems({ "管理ID": normalizedItemId });
  return items.length ? items[0] : null;
}

function createItem(input) {
  var payload = input && typeof input === "object" ? input : {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return null;

  var headers = CONFIG.HEADERS.slice();
  var nextRow = Math.max(sheet.getLastRow() + 1, 2);
  var rowData = headers.map(function(header) {
    return Object.prototype.hasOwnProperty.call(payload, header) ? payload[header] : "";
  });
  var shopValue = Object.prototype.hasOwnProperty.call(payload, "ショップ") ? payload["ショップ"] : "";
  var itemId = generateId_(shopValue);

  rowData[CONFIG.COLS.ID - 1] = itemId;

  if (!rowData[CONFIG.COLS.STATUS - 1]) {
    rowData[CONFIG.COLS.STATUS - 1] = CONFIG.STATUS.LISTING;
  }

  sheet.getRange(nextRow, 1, 1, headers.length).setValues([rowData]);

  return getItem(itemId);
}

function lookupAddressByZip(zip) {
  try {
    var normalizedZip = String(zip || "").replace(/[^0-9]/g, "");
    if (!/^\d{7}$/.test(normalizedZip)) return null;

    var response = UrlFetchApp.fetch(
      "https://zipcloud.ibsnet.co.jp/api/search?zipcode=" + encodeURIComponent(normalizedZip),
      { muteHttpExceptions: true }
    );
    var payload = JSON.parse(response.getContentText());
    if (!payload || !payload.results || !payload.results.length) return null;

    var result = payload.results[0];
    return {
      prefecture: result.address1 || "",
      city: result.address2 || "",
      address: result.address3 || ""
    };
  } catch (error) {
    return null;
  }
}

function api_listItems(filter) {
  return listItems(filter);
}

function api_debugContext() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(CONFIG.SHEET_NAME) : null;

  return {
    spreadsheetName: ss ? ss.getName() : '',
    sheetName: CONFIG.SHEET_NAME,
    sheetExists: !!sheet,
    lastRow: sheet ? sheet.getLastRow() : 0,
    lastColumn: sheet ? sheet.getLastColumn() : 0
  };
}

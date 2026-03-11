function showAlert_(title, message) {
  SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
}

function zeroPad_(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatJPY_(n) {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

function formatPercent_(ratio, digits) {
  var d = digits !== undefined ? digits : 1;
  return (ratio * 100).toFixed(d) + '%';
}

function generateId_(shopValue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var shopText = String(shopValue || '');
  var prefix = '';

  if (shopText.indexOf('ヤフオク(Cappa)') !== -1) {
    prefix = 'CA-Y';
  } else if (shopText.indexOf('メルカリ(どすこい)') !== -1) {
    prefix = 'DN-A';
  } else if (shopText.indexOf('メルカリ(Cappa)') !== -1) {
    prefix = 'CP-A';
  }
  if (!prefix) return '';

  var lastRow = sheet.getLastRow();
  var maxNumber = 0;
  if (lastRow > 1) {
    var ids = sheet.getRange(2, CONFIG.COLS.ID, lastRow - 1, 1).getValues();
    var pattern = new RegExp('^' + prefix + '(\\d{4})$');

    ids.forEach(function(rowValue) {
      var value = String(rowValue[0] || '').trim();
      var match = value.match(pattern);
      if (!match) return;

      var number = parseInt(match[1], 10);
      if (number > maxNumber) maxNumber = number;
    });
  }

  return prefix + ('0000' + (maxNumber + 1)).slice(-4);
}

function formatDate_(d) {
  if (!d) return '';
  var date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd');
}

function getMonthStart_() {
  var d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getMonthEnd_() {
  var d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function sum_(arr) {
  return arr.reduce(function(a, b) { return a + (parseFloat(b) || 0); }, 0);
}

function groupBy_(arr, key) {
  return arr.reduce(function(acc, item) {
    var k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function getLastDataRow_(sheet, checkCol) {
  var col     = checkCol || 1;
  var lastRow = sheet.getLastRow();
  var data    = sheet.getRange(1, col, lastRow, 1).getValues();
  for (var i = lastRow - 1; i >= 0; i--) {
    if (data[i][0] !== '') return i + 1;
  }
  return 0;
}

function setNamedRange_(ss, name, range) {
  try {
    ss.setNamedRange(name, range);
  } catch (e) {
    var existing = ss.getRangeByName(name);
    if (existing) ss.removeNamedRange(name);
    ss.setNamedRange(name, range);
  }
}

function log_(msg) {
  var ts = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'HH:mm:ss');
  Logger.log('[' + ts + '] ' + msg);
}

function isValidDate_(val) {
  if (!val) return false;
  var d = val instanceof Date ? val : new Date(val);
  return !isNaN(d.getTime());
}

function isPositiveNumber_(val) {
  var n = parseFloat(val);
  return !isNaN(n) && n > 0;
}

function normalizeMonthString_(monthStr) {
  if (!monthStr) return '';
  
  monthStr = String(monthStr).trim();

  const m = monthStr.match(/^(\d{4})[-\/]?(\d{1,2})$/);
  if (!m) return monthStr;

  const year = m[1];
  const month = ('0' + m[2]).slice(-2);

  return `${year}-${month}`;
}

function getThisMonthString_() {
  const d = new Date();
  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  return `${y}-${m}`;
}

function parseMonthRange_(monthStr) {
  const parts = monthStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return { start, end };
}

function sum_(rows, key) {
  return rows.reduce((total, r) => total + (Number(r[key]) || 0), 0);
}

function toNumber(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function tryParseDate_(v) {
  if (!v) return null;
  if (v instanceof Date) return v;

  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function columnToLetter_(column) {
  var letter = '';
  var temp = column;
  while (temp > 0) {
    var mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

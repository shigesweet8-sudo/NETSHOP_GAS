const CONFIG = Object.freeze({
  SHEET_NAME: '統合売上データ',
  DASH_SHEET_NAME: 'ダッシュボード',
  MONTHLY_SHEET_PREFIX: '月別_',
  ARCHIVE_DASH_PREFIX: '確定版_',
  SUMMARY_SHEET_NAME: 'データ集計サマリー',

  DASHBOARD: Object.freeze({
    SUMMARY_ROW: 3
  }),

  COLORS: Object.freeze({
    HEADER_BG: '#1a73e8',
    HEADER_FG: '#ffffff',
    ALT_ROW: '#f8f9fa',
    POSITIVE: '#34a853'
  }),

  COLS: Object.freeze({
    STATUS: 1,             // A = ステータス
    ID: 2,                 // B = 管理ID
    STAFF: 3,              // C = 出品担当者
    DATE: 4,               // D = 日にち
    PRODUCT_REG_DATE: 5,   // E = 商品登録日
    SHOP: 6,               // F = ショップ
    ITEM_NAME: 7,          // G = 商品名
    COST: 8,               // H = 仕入れ値
    STORAGE: 9,            // I = 保管場所
    QTY: 10,               // J = 個数
    LIST_PRICE: 11,        // K = 出品金額
    NEGOTIATED_PRICE: 12,  // L = 交渉金額
    PRICE_FINAL: 13,       // M = 決済金額
    FEE: 14,               // N = サイト利用料
    SHIPPING: 15,          // O = 配送料
    SHIP_FROM: 16,         // P = 配送元
    PROFIT: 17,            // Q = 粗利(原価引)
    MEMO: 18,              // R = 備考
    CUSTOMER: 19,          // S = 購入者名
    CARRIER: 20,           // T = 配送業者
    TRACKING: 21,          // U = 追跡番号
    ZIP: 22,               // V = 郵便番号
    PREF: 23,              // W = 都道府県
    ADDR2: 24,             // X = 住所2(地番)
    ADDR3: 25,             // Y = 住所3(建物名)
    PHONE: 26,             // Z = 電話番号
    IMPORTED_AT: 4,        // 互換維持用
    ORDER_ID: 2,           // 互換維持用
    SKU: 21,               // 互換維持用
    PROFIT_RATE: 16        // 互換維持用
  }),

  HEADERS: Object.freeze([
    'ステータス',
    '管理ID',
    '出品担当者',
    '日にち',
    '商品登録日',
    'ショップ',
    '商品名',
    '仕入れ値',
    '保管場所',
    '個数',
    '出品金額',
    '交渉金額',
    '決済金額',
    'サイト利用料',
    '配送料',
    '配送元',
    '粗利(原価引)',
    '備考',
    '購入者名',
    '配送業者',
    '追跡番号',
    '郵便番号',
    '都道府県',
    '住所2(地番)',
    '住所3(建物名)',
    '電話番号'
  ]),

  STATUS: Object.freeze({
    LISTING    : '商品登録',
    ON_SALE    : '出品中',
    NEGOTIATING: '値段交渉中',
    PAID       : '決済完了',
    PREPARING  : '発送準備中',
    SHIPPED    : '発送完了',
    COMPLETED  : '取引完了',
    CANCEL     : 'キャンセル'
  }),

  STATUS_LIST: Object.freeze([
    '商品登録',
    '出品中',
    '値段交渉中',
    '決済完了',
    '発送準備中',
    '発送完了',
    '取引完了',
    'キャンセル'
  ]),

  CALC_TARGETS: Object.freeze([
    '決済完了',
    '発送準備中',
    '発送完了',
    '取引完了'
  ])
});

/**
 * Webアプリのエントリポイント。
 * デプロイURLアクセス時に WAVE 画面を返す。
 *
 * @param {GoogleAppsScript.Events.DoGet} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('WAVE');
}

/**
 * Webアプリからの商品一覧取得エントリポイント。
 * API層に委譲してシートデータを返却する。
 *
 * @param {Object=} filter
 * @returns {Array<Array<*>>}
 */
function web_listItems(filter) {
  return api_listItems(filter);
}

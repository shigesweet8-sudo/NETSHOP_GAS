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

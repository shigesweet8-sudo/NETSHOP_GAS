/**
 * Webアプリのエントリポイント。
 * デプロイURLアクセス時に WAVE 画面を返す。
 *
 * @param {GoogleAppsScript.Events.DoGet} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('WAVE');
}

function includeHtml_(fileName) {
  return HtmlService.createTemplateFromFile(fileName).evaluate().getContent();
}

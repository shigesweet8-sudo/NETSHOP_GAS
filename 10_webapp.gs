function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('NETSHOP WebApp');
}
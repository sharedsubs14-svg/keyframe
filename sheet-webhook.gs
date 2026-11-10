// Google Apps Script. Paste into Extensions → Apps Script of the Google Sheet that should collect sign-ups.
// Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone. Copy the URL into SHEET_WEBHOOK_URL.
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents || '{}');
  if (sheet.getLastRow() === 0) sheet.appendRow(['Signed up', 'Email', 'Name', 'Source']);
  sheet.appendRow([data.signed_up || new Date().toISOString(), data.email || '', data.name || '', data.source || 'slate']);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Batch UID Generator
 *
 * Fills any empty cell in column B (configurable) with a UUID.
 * Reads, fills, and writes in one go — much faster than per-cell I/O.
 *
 * Usage: open Apps Script editor, run generateUIDs().
 */
function generateUIDs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var uidColumn = 2; // Column B (adjust if needed)

  // Read entire column values at once
  var uidRange = sheet.getRange(2, uidColumn, lastRow - 1, 1);
  var uidValues = uidRange.getValues();

  // Generate UIDs only for empty cells
  for (var i = 0; i < uidValues.length; i++) {
    if (!uidValues[i][0]) {
      uidValues[i][0] = Utilities.getUuid();
    }
  }

  // Write all values back in one go
  uidRange.setValues(uidValues);
}

/**
 * GENERATE SYLLABUS PDFS (STABLE VERSION WITH RETRY LOGIC)
 *
 * Bulk-generates one syllabus PDF per row in column I of the
 * "Syllabus" sheet. Organizes output into date-named subfolders.
 */

function generateSyllabusPDFs() {
  const CONFIG = {
    SHEET_NAME: "Syllabus",
    PDF_RANGE: "A1:F12",
    LOG_SHEET_NAME: "PDF Logs",
    PARENT_FOLDER_ID: "YOUR_DRIVE_FOLDER_ID_HERE",  // ← REPLACE
    DATA_COL: "I",
    INPUT_CELL: "H2",
    DATE_CELL: "B7",
    RESIZE_ROW: 9,
    MIN_ROW_HEIGHT: 425
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SHEET_NAME}" not found!`);
    return;
  }

  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(`${CONFIG.DATA_COL}2:${CONFIG.DATA_COL}${lastRow}`).getValues();
  const logSheet = getOrCreateLogSheet(ss, CONFIG.LOG_SHEET_NAME);

  let successCount = 0;

  for (let i = 0; i < values.length; i++) {
    const currentValue = values[i][0];
    if (!currentValue || String(currentValue).trim() === "") continue;

    ss.toast(`Generating (${i+1}/${values.length}): ${currentValue}`, "PDF Generator", -1);

    try {
      // 1. Update content
      sheet.getRange(CONFIG.INPUT_CELL).setValue(currentValue);
      SpreadsheetApp.flush();
      Utilities.sleep(1000); // wait for formulas to recalc

      // 2. Adjust layout
      sheet.autoResizeRows(CONFIG.RESIZE_ROW, 1);
      if (sheet.getRowHeight(CONFIG.RESIZE_ROW) < CONFIG.MIN_ROW_HEIGHT) {
        sheet.setRowHeight(CONFIG.RESIZE_ROW, CONFIG.MIN_ROW_HEIGHT);
      }
      SpreadsheetApp.flush();

      // 3. Resolve subfolder by date
      const dateValue = sheet.getRange(CONFIG.DATE_CELL).getValue();
      let subFolderName = (dateValue instanceof Date)
        ? Utilities.formatDate(dateValue, ss.getSpreadsheetTimeZone(), "dd-MM-yyyy")
        : String(dateValue).trim();

      const targetFolder = getOrCreateSubFolder(CONFIG.PARENT_FOLDER_ID, subFolderName);

      // 4. Generate PDF with retry
      const pdfBlob = createPDFBlobWithRetry(ss, sheet, CONFIG.PDF_RANGE, currentValue);

      // 5. Save/update file
      const fileData = saveOrUpdatePDF(targetFolder, currentValue + ".pdf", pdfBlob);

      logSheet.appendRow([fileData.name, fileData.url, new Date(), subFolderName, "Success"]);
      successCount++;

    } catch (err) {
      console.error(`Error: ${err}`);
      logSheet.appendRow([currentValue, "FAILED", new Date(), "N/A", err.toString()]);
    }

    Utilities.sleep(2000);
  }
  ss.toast("Task Finished");
  SpreadsheetApp.getUi().alert(`Done! ${successCount} PDFs generated.`);
}

/**
 * PDF Generation with Retry — tries 3 times if Google fails.
 */
function createPDFBlobWithRetry(ss, sheet, rangeString, filename) {
  const url = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export" +
    "?format=pdf&gid=" + sheet.getSheetId() + "&range=" + rangeString +
    "&size=A4&portrait=false&scale=4&gridlines=false&fzr=false" +
    "&horizontal_alignment=CENTER&vertical_alignment=CENTER" +
    "&top_margin=0&bottom_margin=0&left_margin=0&right_margin=0";

  const options = { headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const r = UrlFetchApp.fetch(url, options);
      if (r.getResponseCode() === 200) {
        return r.getBlob().setName(filename + ".pdf");
      }
    } catch (e) {}
    attempts++;
    Utilities.sleep(3000);
  }

  throw new Error("Export Failed after 3 attempts. Google is likely rate-limiting you.");
}

function getOrCreateSubFolder(parentId, folderName) {
  const parentFolder = DriveApp.getFolderById(parentId);
  const folders = parentFolder.getFoldersByName(folderName);
  while (folders.hasNext()) {
    let folder = folders.next();
    if (!folder.isTrashed()) return folder;
  }
  return parentFolder.createFolder(folderName);
}

function saveOrUpdatePDF(folder, fileName, blob) {
  const existingFiles = folder.getFilesByName(fileName);
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }
  const newFile = folder.createFile(blob);
  return { name: newFile.getName(), url: newFile.getUrl() };
}

function getOrCreateLogSheet(ss, name) {
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(["Name", "Link", "Time", "Folder", "Status"]);
    s.getRange("A1:E1").setFontWeight("bold");
    s.setFrozenRows(1);
  }
  return s;
}

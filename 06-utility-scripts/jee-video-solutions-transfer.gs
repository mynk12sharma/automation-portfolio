/**
 * JEE Video Solutions — QID Duplicate-Check Transfer
 *
 * For each row checked in the "Tracker" sheet, looks up matching QIDs
 * in the "Qid Dump" sheet (filtered by Paper Code + Subject) and
 * transfers any NEW (non-duplicate) QIDs into the "Video Dump" sheet.
 *
 * Sheets required:
 *   • Tracker     - main tracking sheet (with checkbox in column Q)
 *   • Qid Dump    - source of QIDs to transfer
 *   • Video Dump  - destination; existing entries here are de-duplicated
 */

/**
 * Creates a custom menu in the Google Sheet for easy access.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Automation')
    .addItem('Transfer Selected QIDs', 'processSelectedPapers')
    .addToUi();
}

function processSelectedPapers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName("Tracker");
  const qidSheet = ss.getSheetByName("Qid Dump");
  const videoSheet = ss.getSheetByName("Video Dump");

  const mainData = mainSheet.getDataRange().getValues();
  const qidData = qidSheet.getDataRange().getValues();

  // Duplicate check: get all existing QIDs from Video Dump column A
  const existingVideoData = videoSheet.getRange("A:A").getValues().flat().map(String);
  const existingQIDs = new Set(existingVideoData);

  let finalDataToPaste = [];
  const systemTag = "Added by System: " + new Date().toLocaleString();

  // Column indexes (A=0, B=1... I=8, O=14, Q=16, R=17)
  const mainPaperCodeCol = 8;   // Column I
  const mainStatusCol = 14;     // Column O
  const mainCheckboxCol = 16;   // Column Q (checkbox)

  const qidSubjCol = 1;         // Column B
  const qidQidCol = 16;         // Column Q (in Dump)
  const qidPaperCodeCol = 17;   // Column R (in Dump)

  for (let i = 1; i < mainData.length; i++) {
    let isChecked = mainData[i][mainCheckboxCol];

    if (isChecked === true) {
      let paperCode = String(mainData[i][mainPaperCodeCol]).trim();
      let status = String(mainData[i][mainStatusCol]).toLowerCase();

      let subjectsToPull = [];
      if (status.includes("physics done")) subjectsToPull.push("physics");
      if (status.includes("maths done")) subjectsToPull.push("maths");
      if (status.includes("chem done")) subjectsToPull.push("chemistry");

      if (subjectsToPull.length > 0) {
        for (let j = 1; j < qidData.length; j++) {
          let rVal = String(qidData[j][qidPaperCodeCol]).trim();
          let bVal = String(qidData[j][qidSubjCol]).trim().toLowerCase();
          let qVal = String(qidData[j][qidQidCol]).trim();

          // Match Paper Code AND Subject AND not already in Video Dump
          if (rVal === paperCode && subjectsToPull.includes(bVal)) {
            if (!existingQIDs.has(qVal)) {
              finalDataToPaste.push([qVal, systemTag]);
              existingQIDs.add(qVal); // prevent same-run duplicates
            }
          }
        }
      }
    }
  }

  if (finalDataToPaste.length > 0) {
    let lastRow = videoSheet.getLastRow();
    videoSheet.getRange(lastRow + 1, 1, finalDataToPaste.length, 2).setValues(finalDataToPaste);
    SpreadsheetApp.getUi().alert("SUCCESS: Added " + finalDataToPaste.length + " NEW QIDs. Duplicates were skipped.");
  } else {
    SpreadsheetApp.getUi().alert("No NEW data found. Either rows aren't checked or QIDs already exist in Video Dump.");
  }
}

// ═══════════════════════════════════════════════════════════════════
//  NEET Admit Card PDF Generator  v4.5
//  Bulk-generates A4 admit card PDFs from a Google Sheet.
//
//  Features:
//    • Pixel-perfect A4 layout (794×1122 px, all values 11px)
//    • Auto-expanding centre-address row
//    • Custom menu in Sheets for one-click generation
//    • Status + Drive URL written back to source sheet
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  SHEET_NAME     : 'For Script',
  FOLDER_ID      : 'YOUR_DRIVE_FOLDER_ID_HERE',  // ← REPLACE
  COL_FORM_NO    : 1,
  COL_NAME       : 2,
  COL_GENDER     : 3,
  COL_COURSE     : 5,
  COL_PHASE      : 6,
  COL_BATCH      : 7,
  COL_CLASS      : 8,
  COL_CENTER_CITY: 11,
  COL_CENTER_ADDR: 13,
  COL_EXAM_DATE  : 14,
  COL_REPORT_TIME: 15,
  COL_EXAM_TIME  : 16,
  COL_STATUS     : 18,
  COL_LINK       : 19,
  // Paste your base64-encoded PNG/JPG logo string here:
  LOGO_BASE64    : 'PASTE_YOUR_BASE64_LOGO_HERE',
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎓 Admit Cards')
    .addItem('📄 Generate PDFs (Pending Only)', 'generateAdmitCards')
    .addItem('📊 Show Status Summary', 'showSummary')
    .addSeparator()
    .addItem('ℹ️ About', 'showAbout')
    .addToUi();
}

function generateAdmitCards() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sh) {
    ui.alert('❌ Sheet Not Found',
      `No sheet named "${CONFIG.SHEET_NAME}". Check CONFIG.SHEET_NAME.`,
      ui.ButtonSet.OK);
    return;
  }

  let folder;
  try {
    folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  } catch (e) {
    ui.alert('❌ Drive Folder Error',
      `Could not access folder:\n${CONFIG.FOLDER_ID}\n\n${e.message}`,
      ui.ButtonSet.OK);
    return;
  }

  const allRows      = sh.getDataRange().getDisplayValues();
  const dataRows     = allRows.slice(1);
  const firstDataRow = 2;
  let created = 0, skipped = 0, failed = 0;

  dataRows.forEach((row, idx) => {
    const sheetRow = firstDataRow + idx;
    const status   = (row[CONFIG.COL_STATUS] || '').trim();
    const formNo   = (row[CONFIG.COL_FORM_NO] || '').trim();

    if (status === 'Created') { skipped++; return; }
    if (!formNo) return;

    try {
      const d       = extractData(row);
      const htmlStr = buildHtml(d);
      const blob    = HtmlService
                        .createHtmlOutput(htmlStr)
                        .getAs('application/pdf')
                        .setName(`${d.formNo} ${d.name} ${d.examDate}.pdf`);
      const file    = folder.createFile(blob);
      sh.getRange(sheetRow, CONFIG.COL_STATUS + 1).setValue('Created');
      sh.getRange(sheetRow, CONFIG.COL_LINK   + 1).setValue(file.getUrl());
      created++;
    } catch (e) {
      console.error(`Row ${sheetRow} [${formNo}]: ${e.message}`);
      sh.getRange(sheetRow, CONFIG.COL_STATUS + 1).setValue(`Error: ${e.message}`);
      failed++;
    }
  });

  SpreadsheetApp.flush();
  ui.alert('✅ PDF Generation Complete',
    `📄 Created  : ${created}\n⏭️ Skipped  : ${skipped}\n❌ Errors   : ${failed}\n\n` +
    (failed > 0 ? 'Check Apps Script logs.' : 'All PDFs saved to Drive.'),
    ui.ButtonSet.OK);
}

function extractData(row) {
  return {
    formNo      : (row[CONFIG.COL_FORM_NO]     || '').trim(),
    name        : (row[CONFIG.COL_NAME]         || '').trim(),
    gender      : (row[CONFIG.COL_GENDER]       || '').trim(),
    course      : (row[CONFIG.COL_COURSE]       || '').trim(),
    phase       : (row[CONFIG.COL_PHASE]        || '').trim(),
    batch       : (row[CONFIG.COL_BATCH]        || '').trim(),
    studentClass: (row[CONFIG.COL_CLASS]        || '').trim(),
    centerCity  : (row[CONFIG.COL_CENTER_CITY]  || '').trim(),
    centerAddr  : (row[CONFIG.COL_CENTER_ADDR]  || '').trim(),
    examDate    : (row[CONFIG.COL_EXAM_DATE]    || '').trim(),
    reportTime  : (row[CONFIG.COL_REPORT_TIME]  || '').trim(),
    examTime    : (row[CONFIG.COL_EXAM_TIME]    || '').trim(),
  };
}

// The buildHtml function returns the full A4 admit-card HTML. It is
// approximately 400 lines of carefully-tuned HTML/CSS for the Apps
// Script HTML-to-PDF renderer. See your local copy for the complete
// template. Key design choices:
//
//   • All value cells strictly 11px (designed by trial and error to
//     fit comfortably on A4 with the available column widths)
//   • White backgrounds, black text everywhere — coloured backgrounds
//     with white text are unreliable in the Apps Script renderer
//   • Borders on <table> with border-collapse:collapse instead of on
//     individual <td> elements — avoids broken-line artifacts at cell
//     boundaries
//   • Photo cell uses rowspan to span 7 rows
//   • Address row uses height:68px as min-height — auto-expands for
//     long centre names
//   • Signature strip uses flex:1 to fill leftover A4 height
//
// Copy your buildHtml(d) function from your local copy and paste it
// below. Test once before deploying.

function buildHtml(d) {
  // ─── PASTE YOUR FULL buildHtml IMPLEMENTATION HERE ───
  // Template uses ${d.formNo}, ${d.name}, etc.
  // Uses logoSrc = `data:image/png;base64,${CONFIG.LOGO_BASE64}` in the header
  return '';
}

function showSummary() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) { ui.alert('Sheet not found: ' + CONFIG.SHEET_NAME); return; }
  const data = sh.getDataRange().getDisplayValues().slice(1);
  let total = 0, created = 0, errors = 0, pending = 0;
  data.forEach(row => {
    if (!(row[CONFIG.COL_FORM_NO] || '').trim()) return;
    total++;
    const s = (row[CONFIG.COL_STATUS] || '').trim();
    if      (s === 'Created')       created++;
    else if (s.startsWith('Error')) errors++;
    else                            pending++;
  });
  ui.alert('📊 Admit Card Status',
    `Total     : ${total}\n✅ Done    : ${created}\n` +
    `⏳ Pending : ${pending}\n❌ Errors  : ${errors}`,
    ui.ButtonSet.OK);
}

function showAbout() {
  SpreadsheetApp.getUi().alert('ℹ️ About',
    'NEET Admit Card Generator v4.5\n\n' +
    '• All value fonts strictly 11px\n' +
    '• Address row auto-expands\n' +
    '• Status + Link written to cols S & T',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

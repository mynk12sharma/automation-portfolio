/**
 * ============================================================
 *  NEET Q-SLIP MANAGER & DASHBOARD (ALL-IN-ONE)
 *  Version: 10.6
 *
 *  A full-stack Apps Script web app for assigning test-paper
 *  preparation tasks to faculty, with consolidated emails,
 *  PDF attachments, one-click webhook actions, and a real-time
 *  dashboard with sortable/filterable tables.
 * ============================================================
 *
 *  DEPLOYMENT
 *  ──────────
 *  1. Replace placeholder IDs in CONFIG below
 *  2. Deploy → "New deployment" → "Web app"
 *  3. "Execute as": Me
 *  4. "Who has access": Anyone (or per your org policy)
 */

const CONFIG = {
  SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE",   // ← REPLACE
  SHEET_QSLIP: "QSLIP",
  SHEET_FACULTY: "Faculty Details",
  SHEET_LOG: "LOG",
  FOLDER_ID_PDFS: "YOUR_DRIVE_FOLDER_ID_HERE",  // ← REPLACE

  COL_QSLIP_ID: 1,      // Column B: s no (UNIQUE ID)
  COL_FACULTY_NAME: 9,  // Column J: Faculty Name
  COL_STATUS: 14        // Column O: Status
};

let cachedTz = null;
function getTz() {
  if (!cachedTz) cachedTz = Session.getScriptTimeZone();
  return cachedTz;
}

/**
 * WEB APP ENTRY POINT
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.id && e.parameter.status) {
    return handleWebAction(e.parameter.id, e.parameter.status);
  }
  return createDashboard();
}

function createDashboard() {
  return HtmlService.createHtmlOutput(getDashboardHtml())
    .setTitle('NEET Q-Slip Manager | Pro')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ──────────────────────────────────────────────────────────────
//  IMPLEMENTATION NOTES
//
//  Full Code.gs (~1500 lines) implements:
//
//  Server-side functions:
//    • processBulkSlips(ids)            - Main dispatcher with consolidation
//    • processConsolidatedBatch(...)    - N Q-slips → 1 email + N PDFs
//    • executeQSlipWorkflow(...)        - Single-slip path
//    • sendConsolidatedEmail(...)       - HTML email with summary table
//    • sendEmail(email, data, pdf, url) - Single-slip HTML email
//    • createQSlipPDF(data)             - 2-page A4 PDF generator
//    • handleWebAction(id, status)      - One-click webhook handler
//                                          (uses TextFinder for <500ms response)
//    • getDashboardData()               - Returns sanitized JSON for UI
//                                          (Date objects → strings to avoid
//                                          serialization issues with
//                                          google.script.run)
//    • getColumnMap, extractRowData, etc. - Schema mappers
//    • getFacultyDirectory()            - Builds name → email lookup
//    • bulkLogAction(entries)           - Single-write batched logging
//
//  Front-end (getDashboardHtml):
//    • Tailwind CDN (no build step)
//    • Sidebar nav with view switching
//    • Stat cards · search · per-column dropdowns
//    • Sortable headers (sortTable function)
//    • Zero-wait queue: queueMails → taskQueue → processNextInQueue
//    • Toast notifications
//    • Audit log with pagination + filters
//
//  ── Paste your full implementation from your local copy ──
//
// ──────────────────────────────────────────────────────────────

// ================================================================
//  TEST SCHEDULE DASHBOARD — Code.gs
//  Google Apps Script server-side code
// ================================================================

const SHEET_ID   = 'YOUR_SHEET_ID_HERE';       // ← REPLACE with your Google Sheet ID
const SHEET_NAME = 'YOUR_SHEET_TAB_NAME';      // ← REPLACE with your sheet tab name
const ACADEMIC_EMAIL = 'academic@yourorg.com'; // ← CHANGE THIS
const DLP_EMAIL      = 'dlp@yourorg.com';       // ← CHANGE THIS
const OPS_EMAIL      = 'ops@yourorg.com';        // ← CHANGE THIS (receives issue reports)

// ──────────────────────────────────────────────────────────────
//  1. SERVE THE WEB APP
// ──────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Test Schedule Dashboard 2026-27')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ──────────────────────────────────────────────────────────────
//  2. READ SHEET DATA
// ──────────────────────────────────────────────────────────────
function getSheetData() {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const data  = sheet.getDataRange().getValues();
    if (data.length < 2) return { rows: [], headers: [] };

    const headers = data[0].map(h => String(h).trim());
    const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const rows = [];

    for (let i = 1; i < data.length; i++) {
      const obj = {};
      let hasData = false;
      headers.forEach((h, idx) => {
        let val = data[i][idx];
        if (val instanceof Date)
          val = `${val.getDate()}-${months[val.getMonth()]}-${val.getFullYear()}`;
        val = (val !== null && val !== undefined) ? String(val).trim() : '';
        obj[h] = val;
        if (val) hasData = true;
      });
      if (hasData) rows.push(obj);
    }
    return { rows, headers, total: rows.length };
  } catch (e) {
    return { error: e.message, rows: [], headers: [] };
  }
}

// ──────────────────────────────────────────────────────────────
//  3. SAVE MILESTONE STATE (T-60 / T-45 / T-30)
//     Stored per-user via UserProperties
// ──────────────────────────────────────────────────────────────
function saveMilestone(uid, mk, done) {
  try {
    const props = PropertiesService.getUserProperties();
    const key   = `dlp_${uid}_${mk}`;
    if (done) {
      props.setProperty(key, JSON.stringify({
        done: true,
        by: Session.getActiveUser().getEmail(),
        at: new Date().toISOString()
      }));
    } else {
      props.deleteProperty(key);
    }
    return { success: true };
  } catch (e) { return { error: e.message }; }
}

// ──────────────────────────────────────────────────────────────
//  4. GET ALL MILESTONE STATES
// ──────────────────────────────────────────────────────────────
function getMilestones() {
  try {
    const props  = PropertiesService.getUserProperties().getAll();
    const result = {};
    Object.keys(props).forEach(k => {
      if (k.startsWith('dlp_')) {
        try { result[k] = JSON.parse(props[k]); } catch(e) { result[k] = { done: true }; }
      }
    });
    return result;
  } catch (e) { return {}; }
}

// ──────────────────────────────────────────────────────────────
//  5. SEND DLP REMINDER EMAIL
//     Sends only the NEXT upcoming test date's papers
//     Uses HTML email for clean, modern design
// ──────────────────────────────────────────────────────────────
function sendReminderEmail(data) {
  try {
    const { tests, msDays, msTitle } = data;
    const toEmail = Number(msDays) === 30 ? DLP_EMAIL : ACADEMIC_EMAIL;

    // ── Find the single next upcoming test date ──────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function parseTestDate(str) {
      if (!str || str === '—') return null;
      const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
      const p = str.split('-');
      if (p.length === 3 && months[p[1]] !== undefined)
        return new Date(+p[2], months[p[1]], +p[0]);
      return new Date(str);
    }

    const futureDates = (tests || [])
      .map(t => parseTestDate(t.testDate))
      .filter(d => d && d >= today)
      .map(d => d.getTime());

    if (!futureDates.length) {
      return { error: 'No upcoming DLP tests found to send.' };
    }

    const nextDateTs  = Math.min(...futureDates);
    const nextDateObj = new Date(nextDateTs);
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const nextDateStr = `${nextDateObj.getDate()}-${M[nextDateObj.getMonth()]}-${nextDateObj.getFullYear()}`;

    const filtered = (tests || []).filter(t => {
      const d = parseTestDate(t.testDate);
      return d && d.getTime() === nextDateTs;
    });

    const subject = `[Action Required] DLP Pen & Paper — T-${msDays}: ${msTitle} | Test Date: ${nextDateStr}`;

    const actionNote = Number(msDays) === 60
      ? 'Kindly begin paper preparation immediately. The paper finalization deadline (T-45) is shown in each row below. Please ensure all papers are reviewed and ready before the finalize date.'
      : Number(msDays) === 45
      ? 'The paper finalization deadline has arrived. Please ensure all papers listed below are fully finalized, reviewed, and ready for use.'
      : 'Please share the finalized papers with the DLP processing team immediately for printing and dispatch as per the schedule.';

    const rowsHtml = filtered.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f7f9ff'};">
        <td style="padding:11px 14px;border-bottom:1px solid #e8edf8;font-size:13px;font-weight:600;color:#1e3a8a;white-space:nowrap;">${r.testDate}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #e8edf8;font-size:13px;font-weight:500;color:#111827;">${r.testName}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #e8edf8;font-size:13px;color:#374151;">${r.courseName}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #e8edf8;font-size:13px;color:#374151;text-align:center;">${r.phase}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #e8edf8;text-align:center;">
          <span style="background:#fef3c7;color:#92400e;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;white-space:nowrap;">📄 ${r.mode}</span>
        </td>
        <td style="padding:11px 14px;border-bottom:1px solid #e8edf8;text-align:center;">
          <span style="background:#dbeafe;color:#1e40af;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;white-space:nowrap;">📅 ${r.finalizeBy}</span>
        </td>
      </tr>`).join('');

    const badgeBg    = Number(msDays)===60?'#fef3c7':Number(msDays)===45?'#dbeafe':'#d1fae5';
    const badgeColor = Number(msDays)===60?'#92400e':Number(msDays)===45?'#1e40af':'#065f46';
    const badgeLabel = `T-${msDays} — ${msTitle}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:32px 0;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <tr>
    <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:28px 32px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#93c5fd;margin-bottom:6px;">Test Schedule Dashboard · DLP Paper Reminder</div>
      <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Paper Preparation Reminder</div>
      <div style="margin-top:10px;">
        <span style="background:${badgeBg};color:${badgeColor};font-size:12px;font-weight:600;padding:4px 12px;border-radius:99px;">${badgeLabel}</span>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding:28px 32px 20px;">
      <p style="font-size:14.5px;color:#111827;margin:0 0 8px;line-height:1.7;">Dear Academic Team,</p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;line-height:1.7;">This is a reminder to begin the preparation of test papers for the DLP courses in <strong>Pen &amp; Paper mode</strong>.<br>The test details are mentioned below for your reference.</p>
      <p style="font-size:14px;color:#374151;margin:0 0 20px;line-height:1.7;">Kindly ensure that the papers are prepared as per the guidelines and within the stipulated timelines.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:8px;margin-bottom:22px;">
        <tr>
          <td style="padding:14px 18px;">
            <span style="font-size:12px;color:#1e40af;font-weight:600;">📅 Test Date:</span>
            <span style="font-size:13px;color:#1e3a8a;font-weight:700;margin-left:8px;">${nextDateStr}</span>
            <span style="margin:0 14px;color:#bfdbfe;">|</span>
            <span style="font-size:12px;color:#1e40af;font-weight:600;">📋 Papers in this reminder:</span>
            <span style="font-size:13px;color:#1e3a8a;font-weight:700;margin-left:8px;">${filtered.length}</span>
          </td>
        </tr>
      </table>

      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:22px;">
        <span style="font-size:13px;color:#92400e;line-height:1.6;">${actionNote}</span>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;font-size:13px;">
        <thead>
          <tr style="background:#1e3a8a;">
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#bfdbfe;white-space:nowrap;">Test Date</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#bfdbfe;">Test Name</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#bfdbfe;">Course Name</th>
            <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#bfdbfe;">Phase</th>
            <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#bfdbfe;">Mode</th>
            <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#bfdbfe;">Finalize By</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

    </td>
  </tr>

  <tr>
    <td style="background:#f8faff;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Best regards,<br><strong style="color:#111827;">Test OPS</strong><br><span style="font-size:12px;color:#9ca3af;">Test Schedule Dashboard · Auto-generated reminder</span></p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    GmailApp.sendEmail(toEmail, subject, '', {
      htmlBody,
      cc  : Session.getActiveUser().getEmail(),
      name: 'Test OPS'
    });
    return { success: true, sentTo: toEmail };
  } catch (e) { return { error: e.message }; }
}

// ──────────────────────────────────────────────────────────────
//  6. SAVE REPORT (issue reported by user about a test)
//     Stored in ScriptProperties so ALL users can see reports
// ──────────────────────────────────────────────────────────────
function saveReport(data) {
  try {
    const props = PropertiesService.getScriptProperties();
    const id    = 'rpt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const report = {
      id,
      testName   : data.testName   || '',
      testDate   : data.testDate   || '',
      stream     : data.stream     || '',
      courseName : data.courseName || '',
      centre     : data.centre     || '',
      issueType  : data.issueType  || 'Other Issue',
      description: data.description|| '',
      reportedBy : Session.getActiveUser().getEmail(),
      reportedAt : new Date().toISOString(),
      resolved   : false
    };
    props.setProperty(id, JSON.stringify(report));

    try {
      const subject = `[Issue Reported] ${report.issueType} — ${report.testName}`;
      const body =
`A new issue has been reported on the Test Schedule Dashboard.

Issue Type  : ${report.issueType}
Test Name   : ${report.testName}
Test Date   : ${report.testDate}
Stream      : ${report.stream}
Course      : ${report.courseName}
Centre      : ${report.centre}
Reported By : ${report.reportedBy}
Description : ${report.description || 'No additional details provided.'}

Please log in to the Test Schedule Dashboard to review and resolve this issue.

— Test Schedule Dashboard`;
      GmailApp.sendEmail(OPS_EMAIL, subject, body, { name: 'Test Schedule Dashboard' });
    } catch(mailErr) {
      Logger.log('Report email failed: ' + mailErr.message);
    }

    return { success: true, id };
  } catch (e) { return { error: e.message }; }
}

// ──────────────────────────────────────────────────────────────
//  7. GET ALL REPORTS
// ──────────────────────────────────────────────────────────────
function getReports() {
  try {
    const props   = PropertiesService.getScriptProperties().getAll();
    const reports = [];
    Object.keys(props).forEach(k => {
      if (k.startsWith('rpt_')) {
        try { reports.push(JSON.parse(props[k])); } catch(e) {}
      }
    });
    return reports.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  } catch (e) { return []; }
}

// ──────────────────────────────────────────────────────────────
//  8. RESOLVE REPORT
// ──────────────────────────────────────────────────────────────
function resolveReport(id) {
  try {
    const props = PropertiesService.getScriptProperties();
    const raw   = props.getProperty(id);
    if (!raw) return { error: 'Report not found' };
    const rpt     = JSON.parse(raw);
    rpt.resolved   = true;
    rpt.resolvedBy = Session.getActiveUser().getEmail();
    rpt.resolvedAt = new Date().toISOString();
    props.setProperty(id, JSON.stringify(rpt));
    return { success: true };
  } catch (e) { return { error: e.message }; }
}

// ──────────────────────────────────────────────────────────────
//  9. GET CONFIG
// ──────────────────────────────────────────────────────────────
function getConfig() {
  return {
    academicEmail: ACADEMIC_EMAIL,
    dlpEmail:      DLP_EMAIL,
    opsEmail:      OPS_EMAIL,
    userEmail:     Session.getActiveUser().getEmail()
  };
}

// ================================================================
//  SYLLABUS PDF GENERATOR
//  Functions called from the dashboard to generate syllabus PDFs
// ================================================================

const SYLLABUS_CONFIG = {
  SHEET_NAME      : 'Syllabus',
  PDF_RANGE       : 'A1:F12',
  LOG_SHEET_NAME  : 'PDF Logs',
  PARENT_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE',  // ← REPLACE
  DATA_COL        : 'I',
  INPUT_CELL      : 'H2',
  DATE_CELL       : 'B7',
  RESIZE_ROW      : 9,
  MIN_ROW_HEIGHT  : 425
};

function getSyllabusItems() {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SYLLABUS_CONFIG.SHEET_NAME);
    if (!sheet) return { error: `Sheet "${SYLLABUS_CONFIG.SHEET_NAME}" not found. Check the sheet tab name.` };

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { items: [] };

    const values = sheet.getRange(
      `${SYLLABUS_CONFIG.DATA_COL}2:${SYLLABUS_CONFIG.DATA_COL}${lastRow}`
    ).getValues();

    const items = [];
    values.forEach((row, i) => {
      const val = String(row[0] || '').trim();
      if (val) items.push({ index: i, value: val });
    });

    return { items, total: items.length };
  } catch (e) {
    return { error: e.message };
  }
}

function generateSingleSyllabusPDF(value) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SYLLABUS_CONFIG.SHEET_NAME);
    if (!sheet) return { error: `Sheet "${SYLLABUS_CONFIG.SHEET_NAME}" not found.` };

    const logSheet = _getOrCreateLogSheet(ss, SYLLABUS_CONFIG.LOG_SHEET_NAME);

    sheet.getRange(SYLLABUS_CONFIG.INPUT_CELL).setValue(value);
    SpreadsheetApp.flush();
    Utilities.sleep(1200);

    sheet.autoResizeRows(SYLLABUS_CONFIG.RESIZE_ROW, 1);
    if (sheet.getRowHeight(SYLLABUS_CONFIG.RESIZE_ROW) < SYLLABUS_CONFIG.MIN_ROW_HEIGHT) {
      sheet.setRowHeight(SYLLABUS_CONFIG.RESIZE_ROW, SYLLABUS_CONFIG.MIN_ROW_HEIGHT);
    }
    SpreadsheetApp.flush();

    const dateValue = sheet.getRange(SYLLABUS_CONFIG.DATE_CELL).getValue();
    const subFolderName = (dateValue instanceof Date)
      ? Utilities.formatDate(dateValue, ss.getSpreadsheetTimeZone(), 'dd-MM-yyyy')
      : String(dateValue).trim();

    const targetFolder = _getOrCreateSubFolder(SYLLABUS_CONFIG.PARENT_FOLDER_ID, subFolderName);
    const pdfBlob = _createPDFBlobWithRetry(ss, sheet, SYLLABUS_CONFIG.PDF_RANGE, value);
    const fileData = _saveOrUpdatePDF(targetFolder, value + '.pdf', pdfBlob);

    logSheet.appendRow([fileData.name, fileData.url, new Date(), subFolderName, 'Success']);

    return { success: true, name: fileData.name, url: fileData.url, folder: subFolderName, value };
  } catch (e) {
    try {
      const ss  = SpreadsheetApp.openById(SHEET_ID);
      const log = _getOrCreateLogSheet(ss, SYLLABUS_CONFIG.LOG_SHEET_NAME);
      log.appendRow([value, 'FAILED', new Date(), 'N/A', e.toString()]);
    } catch(_) {}
    return { error: e.message, value };
  }
}

function getPDFLogs() {
  try {
    const ss       = SpreadsheetApp.openById(SHEET_ID);
    const logSheet = ss.getSheetByName(SYLLABUS_CONFIG.LOG_SHEET_NAME);
    if (!logSheet) return { logs: [] };

    const lastRow = logSheet.getLastRow();
    if (lastRow < 2) return { logs: [] };

    const startRow = Math.max(2, lastRow - 99);
    const numRows  = lastRow - startRow + 1;
    const data     = logSheet.getRange(startRow, 1, numRows, 5).getValues();

    const logs = data.reverse().map(r => ({
      name  : String(r[0] || ''),
      url   : String(r[1] || ''),
      time  : r[2] instanceof Date ? r[2].toISOString() : String(r[2] || ''),
      folder: String(r[3] || ''),
      status: String(r[4] || '')
    }));

    return { logs };
  } catch (e) {
    return { error: e.message, logs: [] };
  }
}

function _createPDFBlobWithRetry(ss, sheet, rangeString, filename) {
  const url =
    'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export' +
    '?format=pdf&gid=' + sheet.getSheetId() +
    '&range=' + rangeString +
    '&size=A4&portrait=false&scale=4&gridlines=false&fzr=false' +
    '&horizontal_alignment=CENTER&vertical_alignment=CENTER' +
    '&top_margin=0&bottom_margin=0&left_margin=0&right_margin=0';

  const options = {
    headers         : { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = UrlFetchApp.fetch(url, options);
      if (r.getResponseCode() === 200) {
        return r.getBlob().setName(filename + '.pdf');
      }
    } catch (_) {}
    Utilities.sleep(3000);
  }
  throw new Error('PDF export failed after 3 attempts (Google rate-limiting?).');
}

function _getOrCreateSubFolder(parentId, folderName) {
  const parent  = DriveApp.getFolderById(parentId);
  const folders = parent.getFoldersByName(folderName);
  while (folders.hasNext()) {
    const f = folders.next();
    if (!f.isTrashed()) return f;
  }
  return parent.createFolder(folderName);
}

function _saveOrUpdatePDF(folder, fileName, blob) {
  const existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) existing.next().setTrashed(true);
  const newFile = folder.createFile(blob);
  return { name: newFile.getName(), url: newFile.getUrl() };
}

function _getOrCreateLogSheet(ss, name) {
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(['Name', 'Link', 'Time', 'Folder', 'Status']);
    s.getRange('A1:E1').setFontWeight('bold');
    s.setFrozenRows(1);
  }
  return s;
}

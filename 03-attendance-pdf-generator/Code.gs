/**
 * ============================================================
 *  ATTENDANCE PDF GENERATOR  –  v3
 *  (Grouped by Centre + Paper  |  Folder: Date > Paper > State > Code_City)
 * ============================================================
 *
 *  FOLDER STRUCTURE CREATED:
 *  ROOT/
 *  └── {Exam Date}
 *      └── {Paper Number}
 *          └── {State}
 *              └── {CentreCode_CentreCity}
 *                  └── ClassName_Date_CentreCode_Paper.pdf
 *
 *  HOW TO USE
 *  ──────────
 *  1. Set SOURCE_SHEET_NAME  → your source data sheet tab name
 *  2. Set ATTENDANCE_SHEET_NAME → the template sheet used for PDF rendering
 *  3. Set ROOT_FOLDER_ID → Google Drive folder ID (root destination)
 *  4. Run generateAttendancePDFs()
 *  5. If it times out, run again — resumes from last checkpoint
 *  6. Run resetProcessingState() to start completely fresh
 * ============================================================
 */

// ── CONFIG ───────────────────────────────────────────────────
const SOURCE_SHEET_NAME     = "For Script";
const ATTENDANCE_SHEET_NAME = "Attendance Sheet";
const LOG_SHEET_NAME        = "LOG Attendance";
const ROOT_FOLDER_ID        = "YOUR_DRIVE_FOLDER_ID_HERE";  // ← REPLACE

// Source data column indices (0-based)
const COL = {
  SNO          : 0,   FORM_NO      : 1,   STUDENT_NAME : 2,
  GENDER       : 3,   STREAM       : 4,   COURSE       : 5,
  PHASE_NO     : 6,   BATCH        : 7,   CLASS        : 8,
  MOBILE       : 9,   CENTER_CODE  : 10,  CENTRE_CITY  : 11,
  STATE        : 12,  CENTRE_ADDR  : 13,  EXAM_DATE    : 14,
  REPORT_TIME  : 15,  EXAM_TIME    : 16,  PHOTO        : 17,
  STATUS       : 18,  LINK         : 19,  PAPER_NO     : 20,
};

// Attendance template cell addresses
const TMPL = {
  CLASS         : "C2",
  DATE          : "C3",
  CENTRE        : "E3",
  STATE         : "H1",
  DATA_START_ROW: 5,
};

/**
 * MAIN ENTRY POINT
 */
function generateAttendancePDFs() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    Logger.log("⚠️ Could not acquire lock. Another instance is running.");
    return;
  }

  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const srcSheet  = ss.getSheetByName(SOURCE_SHEET_NAME);
    const tmplSheet = ss.getSheetByName(ATTENDANCE_SHEET_NAME);

    if (!srcSheet)  { Logger.log("❌ Source sheet not found: "   + SOURCE_SHEET_NAME);     return; }
    if (!tmplSheet) { Logger.log("❌ Template sheet not found: " + ATTENDANCE_SHEET_NAME); return; }

    const props     = PropertiesService.getScriptProperties();
    const startTime = Date.now();
    const MAX_MS    = 4.5 * 60 * 1000;

    let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) {
      logSheet = ss.insertSheet(LOG_SHEET_NAME);
      logSheet.appendRow([
        "S.No", "File Name", "File Link",
        "Centre", "Paper No", "State",
        "Class", "Date", "Students",
        "Folder Link", "Timestamp", "Status"
      ]);
    }
    let sNo = logSheet.getLastRow();

    const srcData = srcSheet.getDataRange().getValues();
    const students = [];
    for (let r = 1; r < srcData.length; r++) {
      const row = srcData[r];
      if (!row[COL.STUDENT_NAME]) continue;
      students.push(row);
    }

    if (students.length === 0) {
      Logger.log("❌ No student data found in sheet: " + SOURCE_SHEET_NAME);
      return;
    }

    const groups  = buildGroups_(students);
    const groupKeys   = Object.keys(groups);
    const totalGroups = groupKeys.length;

    Logger.log(`📊 ${students.length} students → ${totalGroups} PDF groups (Centre × Paper)`);

    let startIdx = parseInt(props.getProperty('v3_lastIndex') || '0');

    if (startIdx === 0) {
      props.setProperty('v3_sessionId',    String(Date.now()));
      props.setProperty('v3_totalGroups',  String(totalGroups));
      logSheet.appendRow([
        ++sNo, "▶ BATCH START", "",
        `${totalGroups} groups`, "", "",
        "", "", "", "", new Date(), "Processing"
      ]);
      SpreadsheetApp.flush();
    }

    const rootFolder  = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const folderCache = {};

    let processedCount = 0;
    let shouldContinue = false;

    for (let gi = startIdx; gi < groupKeys.length; gi++) {

      if (Date.now() - startTime > MAX_MS) {
        props.setProperty('v3_lastIndex', String(gi));
        SpreadsheetApp.flush();
        logSheet.appendRow([
          ++sNo, "⏸ BATCH PAUSE", "",
          `Progress: ${gi}/${totalGroups}`, "", "",
          "", "", "", "", new Date(),
          `${processedCount} done this run`
        ]);
        SpreadsheetApp.flush();
        shouldContinue = true;
        break;
      }

      const g = groups[groupKeys[gi]];
      Logger.log(
        `📄 [${gi + 1}/${totalGroups}] ` +
        `${g.centreCode}_${g.centreName} | ${g.paperNo} | ` +
        `${g.state} | ${g.students.length} student(s)`
      );

      try {
        writeGroupToTemplate_(tmplSheet, g);
        SpreadsheetApp.flush();
        Utilities.sleep(600);
        SpreadsheetApp.flush();

        const lastRow = getLastDataRow_(tmplSheet);
        if (lastRow < TMPL.DATA_START_ROW) {
          logSheet.appendRow([
            ++sNo, "NO DATA", "",
            g.centreName, g.paperNo, g.state,
            g.className, g.dateStr, 0,
            "", new Date(), "Skipped"
          ]);
          continue;
        }

        const targetFolder = getTargetFolder_(
          rootFolder, folderCache,
          g.dateStr, g.paperNo, g.state, g.centreCode, g.centreName
        );

        const safeClass  = g.className.replace(/[/\\?%*:|"<>]/g, "-");
        const safePaper  = g.paperNo.replace(/[/\\?%*:|"<>]/g, "-");
        const safeCode   = g.centreCode.replace(/[/\\?%*:|"<>]/g, "-");
        const fileName   = `${safeClass}_${g.dateStr}_${safeCode}_${safePaper}.pdf`;

        try {
          const old = targetFolder.getFilesByName(fileName);
          while (old.hasNext()) old.next().setTrashed(true);
        } catch (e) {}

        const file = exportAsPDF_(ss, tmplSheet, targetFolder, fileName, lastRow);

        logSheet.appendRow([
          ++sNo, fileName, file.getUrl(),
          `${g.centreCode}_${g.centreName}`, g.paperNo, g.state,
          g.className, g.dateStr, g.students.length,
          targetFolder.getUrl(), new Date(), "✅ Generated"
        ]);

        processedCount++;

        if (processedCount % 10 === 0) {
          props.setProperty('v3_lastIndex', String(gi + 1));
          SpreadsheetApp.flush();
          Logger.log(`💾 Checkpoint saved: ${gi + 1}/${totalGroups}`);
        }

      } catch (e) {
        Logger.log(`❌ Error on group ${gi}: ${e.message}`);
        logSheet.appendRow([
          ++sNo, "❌ ERROR", "",
          `${g.centreCode}_${g.centreName}`, g.paperNo, g.state,
          g.className, g.dateStr, g.students.length,
          "", new Date(), e.message.substring(0, 100)
        ]);

        if (e.message.includes('quota') || e.message.includes('invoked too many times')) {
          props.setProperty('v3_lastIndex', String(gi + 1));
          logSheet.appendRow([
            ++sNo, "🛑 QUOTA EXCEEDED", "",
            `At: ${gi + 1}/${totalGroups}`, "", "",
            "", "", "", "", new Date(), "Will resume next run"
          ]);
          SpreadsheetApp.flush();
          return;
        }
      }

      Utilities.sleep(1200);
    }

    if (shouldContinue) {
      createContinuationTrigger_();
      Logger.log("⏭ Continuation trigger set (runs in 2 min)");
    } else {
      props.deleteProperty('v3_lastIndex');
      props.deleteProperty('v3_sessionId');
      props.deleteProperty('v3_totalGroups');
      deleteContinuationTriggers_();

      logSheet.appendRow([
        ++sNo, "✅ BATCH COMPLETE", "",
        `${totalGroups} groups`, "", "",
        "", "", processedCount,
        "", new Date(), `${processedCount} PDFs generated`
      ]);
      SpreadsheetApp.flush();
      Logger.log(`✅ All done! ${processedCount} PDFs generated across ${totalGroups} groups.`);
    }

  } catch (e) {
    Logger.log("🔴 Critical error: " + e.message);
    const ls = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
    if (ls) ls.appendRow([
      ls.getLastRow() + 1, "🔴 CRITICAL ERROR", "",
      "", "", "", "", "", "", "", new Date(), e.message
    ]);
  } finally {
    lock.releaseLock();
  }
}


// ═══════════════════════════════════════════════════════════
//  GROUPING
// ═══════════════════════════════════════════════════════════
function buildGroups_(students) {
  const groups = {};

  for (const s of students) {
    const centreName = String(s[COL.CENTRE_CITY]).trim();
    const centreCode = String(s[COL.CENTER_CODE]).trim();
    const paperNo    = String(s[COL.PAPER_NO]).trim();
    const key        = `${centreName}|||${paperNo}`;

    if (!groups[key]) {
      groups[key] = {
        centreName, centreCode, paperNo,
        centreAddr : String(s[COL.CENTRE_ADDR]).trim(),
        state      : String(s[COL.STATE]).trim(),
        className  : String(s[COL.CLASS]).trim(),
        examDate   : s[COL.EXAM_DATE],
        dateStr    : formatDate_(s[COL.EXAM_DATE]),
        students   : []
      };
    }
    groups[key].students.push(s);
  }

  return groups;
}


// ═══════════════════════════════════════════════════════════
//  FOLDER STRUCTURE
// ═══════════════════════════════════════════════════════════
function getTargetFolder_(rootFolder, cache, dateStr, paperNo, state, centreCode, centreName) {
  const lvl1 = sanitizeFolderName_(dateStr);
  const lvl2 = sanitizeFolderName_(paperNo);
  const lvl3 = sanitizeFolderName_(state);
  const lvl4 = sanitizeFolderName_(`${centreCode}_${centreName}`);

  const pathKey = `${lvl1}/${lvl2}/${lvl3}/${lvl4}`;
  if (cache[pathKey]) return cache[pathKey];

  const l1 = getOrCreateFolder_(rootFolder, lvl1);
  const l2 = getOrCreateFolder_(l1, lvl2);
  const l3 = getOrCreateFolder_(l2, lvl3);
  const l4 = getOrCreateFolder_(l3, lvl4);

  cache[pathKey] = l4;
  return l4;
}


// ═══════════════════════════════════════════════════════════
//  TEMPLATE WRITER
// ═══════════════════════════════════════════════════════════
function writeGroupToTemplate_(sheet, group) {
  const clearRows = Math.max(sheet.getLastRow() - TMPL.DATA_START_ROW + 10, 50);
  sheet.getRange(TMPL.DATA_START_ROW, 1, clearRows, 8).clearContent();

  sheet.getRange(TMPL.CLASS).setValue(group.className);
  sheet.getRange(TMPL.DATE).setValue(group.dateStr);
  sheet.getRange(TMPL.CENTRE).setValue(group.centreAddr);
  sheet.getRange(TMPL.STATE).setValue(group.state);

  if (group.students.length === 0) return;

  const rows = group.students.map((s, idx) => [
    idx + 1,
    s[COL.FORM_NO],
    s[COL.STUDENT_NAME],
    s[COL.BATCH],
    s[COL.COURSE],
    s[COL.PHASE_NO],
    s[COL.PAPER_NO],
    ""
  ]);

  sheet.getRange(TMPL.DATA_START_ROW, 1, rows.length, 8).setValues(rows);
}


// ═══════════════════════════════════════════════════════════
//  PDF EXPORT  (with retry + exponential back-off)
// ═══════════════════════════════════════════════════════════
function exportAsPDF_(ss, sheet, folder, fileName, lastRow) {
  const url =
    `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?` +
    `format=pdf&size=A4&portrait=false&fitw=true&gridlines=false` +
    `&gid=${sheet.getSheetId()}&range=A1:H${lastRow}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) Utilities.sleep(Math.pow(2, attempt) * 1000);

    const res  = UrlFetchApp.fetch(url, {
      headers         : { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();

    if (code === 429) {
      Logger.log(`⚠️ Rate-limited (429), attempt ${attempt}. Waiting...`);
      Utilities.sleep(Math.pow(2, attempt + 1) * 1000);
      continue;
    }
    if (code !== 200) throw new Error(`HTTP ${code}: ${res.getContentText().substring(0, 120)}`);

    return folder.createFile(res.getBlob().setName(fileName));
  }
  throw new Error("PDF export failed after 3 attempts");
}


// ═══════════════════════════════════════════════════════════
//  TRIGGER MANAGEMENT
// ═══════════════════════════════════════════════════════════
function createContinuationTrigger_() {
  deleteContinuationTriggers_();
  const t = ScriptApp.newTrigger('generateAttendancePDFs')
    .timeBased()
    .after(2 * 60 * 1000)
    .create();
  Logger.log("✅ Trigger created: " + t.getUniqueId());
}

function deleteContinuationTriggers_() {
  ScriptApp.getProjectTriggers()
    .filter(t =>
      t.getHandlerFunction()  === 'generateAttendancePDFs' &&
      t.getEventType()        === ScriptApp.EventType.CLOCK
    )
    .forEach(t => ScriptApp.deleteTrigger(t));
}


// ═══════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════
function resetProcessingState() {
  const props = PropertiesService.getScriptProperties();
  Logger.log("Resetting from index: " + (props.getProperty('v3_lastIndex') || 'none'));
  props.deleteProperty('v3_lastIndex');
  props.deleteProperty('v3_sessionId');
  props.deleteProperty('v3_totalGroups');
  deleteContinuationTriggers_();
  Logger.log("✅ State reset complete. Run generateAttendancePDFs() to start fresh.");
}

function checkProcessingStatus() {
  const props = PropertiesService.getScriptProperties();
  const idx   = props.getProperty('v3_lastIndex');
  const total = props.getProperty('v3_totalGroups');
  const sid   = props.getProperty('v3_sessionId');

  if (!sid) { Logger.log("No active processing session."); return; }
  Logger.log(`Progress  : ${idx || 0} / ${total || '?'}`);
  Logger.log(`Session   : ${new Date(parseInt(sid))}`);

  const hasTrigger = ScriptApp.getProjectTriggers()
    .some(t => t.getHandlerFunction() === 'generateAttendancePDFs');
  Logger.log(hasTrigger ? "⏰ Continuation trigger is active." : "⚠️ No trigger found.");
}


// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function getLastDataRow_(sheet) {
  const vals = sheet.getRange("B1:B500").getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i][0]) return i + 1;
  }
  return 0;
}

function getOrCreateFolder_(parent, name) {
  const trimmed = String(name).trim();
  const existing = parent.getFoldersByName(trimmed);
  return existing.hasNext() ? existing.next() : parent.createFolder(trimmed);
}

function sanitizeFolderName_(raw) {
  return String(raw)
    .trim()
    .replace(/[/\\]/g, "-")
    .substring(0, 100);
}

function formatDate_(dateVal) {
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).replace(/[/\\]/g, "-");
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd-MMM-yyyy");
  } catch (e) {
    return String(dateVal);
  }
}

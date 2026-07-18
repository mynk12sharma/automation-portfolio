# Test Schedule Dashboard

A **full-stack Google Apps Script web app** for tracking competitive-exam tests across multiple streams and centres. Built to handle 1000+ tests across JEE Advanced, JEE Main, NEET, and PNCF programs.

## ✨ Features

- 📊 **Overview dashboard** — total tests, upcoming-this-week counts, stream-wise breakdown
- 🟢 **Live / DLP / OLTS sections** — separate filtered views by centre type
- 📅 **DLP milestone tracker** — T-60, T-45, T-30 paper-preparation deadlines with per-user state (`PropertiesService`)
- 📧 **HTML email reminders** — one-click bulk reminder emails to DLP/Academic teams with auto-generated test tables
- 📄 **Syllabus PDF generator** — bulk-generate per-batch syllabus PDFs from a template sheet with date-organized Drive folders, retry logic, and live progress bar
- 🚩 **Issue-reporting system** — users can report problems on any test (typed dropdown), notification panel shows open/resolved reports, OPS gets email alert
- 🌓 **Dark / light themes** — toggle persisted in localStorage
- 🔍 **Filter + search + sort** on every table

## 🛠 Tech

| Layer | Tech |
|---|---|
| Backend | Google Apps Script (`Code.gs`) |
| Frontend | `Index.html` — HTML5, vanilla CSS, vanilla JS (no framework) |
| Storage | Google Sheets (data), `UserProperties` (per-user milestone state), `ScriptProperties` (shared issue reports) |
| Comms | `GmailApp.sendEmail` with HTML body |

## 🏗 Architecture highlights

- **No `getActiveSpreadsheet()` calls** — uses `SpreadsheetApp.openById(SHEET_ID)` because web apps invoked via `google.script.run` don't have an active spreadsheet context
- **Per-user state** via `UserProperties` so each operations user sees their own milestone progress
- **Shared state** via `ScriptProperties` so issue reports are visible to all team members
- **Optimistic UI updates** — milestone toggles update locally first, then persist; reverts on failure
- **Email HTML** uses table-based layouts and inline styles for Gmail / Outlook compatibility

## 🚀 Deployment

1. Create a Google Sheet with your test data (see [Sheet Schema](#-sheet-schema) below)
2. Open Extensions → Apps Script
3. Paste `Code.gs` and create an HTML file named exactly `Index` (no `.html` extension)
4. Set the config constants at the top of `Code.gs`:
   ```javascript
   const SHEET_ID       = 'YOUR_SHEET_ID_HERE';
   const SHEET_NAME     = 'YOUR_SHEET_TAB_NAME';
   const ACADEMIC_EMAIL = 'academic@yourorg.com';
   const DLP_EMAIL      = 'dlp@yourorg.com';
   const OPS_EMAIL      = 'ops@yourorg.com';
   ```
5. Update the `SYLLABUS_CONFIG.PARENT_FOLDER_ID` to your Drive folder ID
6. Deploy → New deployment → Web app → Execute as Me, Access set per your policy

## 📋 Sheet schema

The main sheet (named per `SHEET_NAME`) should have these columns (header row 1):

`Date | Test Name | course name | Test Pattern | Test Time | Duration | Stream | OPS Status | Centre | Phase | Mode | Syllabus PDF | PHYSICS SYLLABUS | CHEMISTRY SYLLABUS | BIO/MATHS SYLLABUS | Paper Code | UID`

Centre values: `Kota` (Live), `DLP`, `OLTS`.

## 📸 Screens

*(Recommended: add screenshots of overview, DLP monitor, and report modal here)*

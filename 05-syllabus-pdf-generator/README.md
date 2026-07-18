# Syllabus PDF Generator (Menu-Driven)

A simpler, **menu-driven** standalone version of the Syllabus PDF generator. (For the dashboard-integrated version, see [01-test-schedule-dashboard](../01-test-schedule-dashboard).)

## ✨ Features

- 📄 Bulk-generates one PDF per row in column I of the `Syllabus` sheet
- 📁 Auto-organizes into date-named subfolders in Drive
- 🔄 Built-in retry logic — 3 attempts with 3-second wait between
- 📋 Audit log to `PDF Logs` sheet
- 📏 Auto-adjusts row 9 height to a minimum of 425 px for layout consistency
- 🎯 Toast notifications during processing

## 🚀 Setup

1. Open the Sheet that contains your `Syllabus` template tab
2. Extensions → Apps Script → paste `Code.gs`
3. Update `PARENT_FOLDER_ID` in the `CONFIG`
4. Run `generateSyllabusPDFs()` from the script editor (first time triggers auth)
5. Optional: bind to a custom menu via `onOpen()` for one-click access

## ⚙️ How it works

For each non-empty cell in column I:
1. Writes the value into H2 (which triggers spreadsheet formulas to populate the syllabus content)
2. Waits 1 second for formulas to recalculate
3. Auto-resizes row 9, enforces 425 px minimum
4. Reads B7 to determine the date subfolder name
5. Exports the range `A1:F12` as a PDF
6. Saves to `{PARENT_FOLDER}/{Date}/{value}.pdf`
7. Logs to `PDF Logs` sheet

If a PDF with the same name exists, it's trashed and replaced.

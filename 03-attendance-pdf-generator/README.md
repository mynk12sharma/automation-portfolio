# Attendance PDF Generator

Generates **bulk attendance PDFs** grouped by exam centre × paper, organized into a deep Drive folder hierarchy. Designed for large-scale exam operations where thousands of students sit across hundreds of centres on the same day.

## ✨ Features

- 📁 **4-level folder hierarchy** automatically built in Drive:
  ```
  Root /
  └── {Exam Date}
      └── {Paper Number}
          └── {State}
              └── {CentreCode_CentreCity}
                  └── ClassName_Date_CentreCode_Paper.pdf
  ```
- ⏸ **Auto-resume on timeout** — Apps Script's 6-minute execution limit doesn't break the job; the script checkpoints progress every 10 files and a time-based trigger restarts it 2 minutes later
- 🔄 **Exponential back-off** on 429 rate-limit responses from Google's export endpoint
- 🔒 **`LockService`** prevents concurrent runs from corrupting state
- 📊 **Audit log** in dedicated sheet with file links, folder links, timestamps, and per-file status
- ⚡ **In-memory folder cache** — Drive is only queried once per unique path, then reused

## 🚀 Setup

1. Open the spreadsheet with student data
2. Extensions → Apps Script → paste `Code.gs`
3. Configure the constants at the top:
   ```javascript
   const SOURCE_SHEET_NAME     = "For Script";
   const ATTENDANCE_SHEET_NAME = "Attendance Sheet";  // template
   const ROOT_FOLDER_ID        = "YOUR_DRIVE_FOLDER_ID_HERE";
   ```
4. Make sure your source sheet has the columns described in [Schema](#-source-sheet-schema)
5. Make sure your "Attendance Sheet" tab is set up as a template:
   - C2 = Class
   - C3 = Test Date
   - E3 = Centre Address
   - H1 = State
   - Row 5+ = student rows (auto-populated by script)
6. Run `generateAttendancePDFs()` from the Apps Script editor
7. If it times out, just run again — it resumes from the last checkpoint
8. To start completely fresh, run `resetProcessingState()`

## 📋 Source sheet schema

22 columns. See the `COL` constant in `Code.gs` for the full mapping. Key columns:

| Col | Field | Used for |
|---|---|---|
| K | Centre Code | folder name + file name |
| L | Test Centre City | grouping key + folder name |
| M | State | folder level 3 |
| N | Centre Full Address | written into template E3 |
| O | Exam Date | folder level 1 + file name |
| U | Paper Number | folder level 2 + grouping key |

## 💡 Why grouping matters

A single exam may have:
- 500 students × 5 centres × 3 paper variants = **7,500 OMR rows** to print
- Without grouping: 1 huge unusable PDF
- With grouping (centre × paper): 15 right-sized PDFs, neatly filed by location and variant

This is exactly the problem this script solves.

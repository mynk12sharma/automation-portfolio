# NEET Admit Card Generator

**Bulk-generates A4 admit card PDFs** from a Google Sheet of student data. Handles thousands of students per exam cycle with pixel-perfect formatting optimized for the Apps Script HTML-to-PDF renderer.

## ✨ Features

- 📄 **Single-pass bulk generation** — processes all "Pending" rows, skips already-generated entries
- 🎨 **Pixel-perfect A4 layout** — 794 × 1122 px, all value fonts strictly 11px, address row auto-expands
- 🖼 **Embedded logo** via base64 → renders even when offline
- ✅ **Status tracking** — writes "Created" + Drive file URL back to source sheet (cols S & T)
- 🧭 **Custom menu** in Google Sheets — one-click PDF generation, status summary
- 🛡 **Graceful error handling** — per-row try/catch, errors logged inline

## 🎨 PDF Layout

```
┌──────────────────────────────────────────────────┐
│  LOGO   │  ALLEN ONLINE — Corporate Office         │
│         │  Address · Phone · Email                 │
├──────────────────────────────────────────────────┤
│       ★ Admit Card — NEET Pen Paper ★            │
├──────────────────────────────────────────────────┤
│  Form No  │  Phase No   │                          │
│  Name (12px, bolded across columns)  │   PHOTO    │
│  Gender   │  Class      │                          │
│  Batch    │  Medium     │                          │
│  Course (full width)                  │            │
│  Exam Dt  │  Exam Time  │                          │
│  Report   │  City       │                          │
│  Centre Address (auto-expanding)                  │
├──────────────────────────────────────────────────┤
│       SIGNATURES (student + authorised)           │
├──────────────────────────────────────────────────┤
│        Important Exam Instructions                │
└──────────────────────────────────────────────────┘
```

## 🛠 Tech

- Apps Script `HtmlService.createHtmlOutput().getAs('application/pdf')`
- Pure HTML + inline CSS (no external dependencies)
- `border-collapse: collapse` with borders on `<table>` for seamless rendering

## 🚀 Setup

1. Open your student-data Google Sheet
2. Extensions → Apps Script → paste `Code.gs` → Ctrl+S
3. Update `CONFIG.FOLDER_ID` to your Drive folder
4. Update `CONFIG.LOGO_BASE64` to your organization's logo (base64-encoded PNG/JPG)
5. Reload the sheet — "🎓 Admit Cards" menu appears
6. Click "📄 Generate PDFs (Pending Only)" → Authorize → Done

## 📋 Sheet Schema

| Col | Field |
|---|---|
| A | (S.No) |
| B | Form No |
| C | Student Name |
| D | Gender |
| F | Course |
| G | Phase |
| H | Batch |
| I | Class |
| L | Centre City |
| N | Centre Full Address |
| O | Exam Date |
| P | Reporting Time |
| Q | Exam Time |
| S | Status (script writes here) |
| T | Drive Link (script writes here) |

## ⚙️ Re-generating a row

Clear column S → run again. Existing PDFs in Drive are not auto-deleted (manual cleanup).

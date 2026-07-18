# NEET Q-Slip Manager Dashboard

A **full-stack web dashboard** for assigning Q-Slip (test-paper preparation slips) to faculty members. Built as an Apps Script web app with Tailwind CSS and vanilla JS — no build step required.

## ✨ Features

- 🎛 **Single-page dashboard** with two views: Assignments + Audit Logs
- 📊 **4 KPI stat cards** — Total / Completed / Acknowledged / Pending
- 🔍 **Real-time filtering** — per-column dropdowns + global search
- ✅ **Bulk selection + dispatch** — select multiple rows, send all in one click
- 📧 **Smart email batching** — multiple Q-Slips to the same faculty get **consolidated** into one email with a summary table + multiple PDF attachments
- 🚀 **Background queue system** — UI never blocks; assignments stream into the queue and process in batches of 5
- 🔗 **One-click webhooks in emails** — faculty can click "Acknowledge" or "Mark Completed" buttons directly from Gmail → updates sheet via `doGet` handler
- 📄 **2-page PDF Q-Slip** generated server-side with full assignment details, syllabus mapping, and difficulty-level guidelines
- 📋 **Sortable columns** on every header
- 🔔 **Toast notifications** for every action
- 🌑 **Audit log** with pagination, status filter, faculty filter

## 🛠 Tech

| Layer | Tech |
|---|---|
| Backend | Google Apps Script (`Code.gs`) — ~600 lines |
| Frontend | Single HTML file with embedded Tailwind CDN + vanilla JS |
| Storage | Google Sheets (QSLIP, Faculty Details, LOG sheets) |
| Email | `MailApp.sendEmail` with HTML body + PDF attachments |
| PDFs | `Utilities.newBlob().getAs(MimeType.PDF)` |

## 🏗 Architecture highlights

### Smart consolidation
When dispatching N Q-Slips to the same faculty, the system:
1. Detects same-email recipients
2. Generates N PDFs
3. Sends **one email** with a summary table + all N PDFs attached
4. Updates all N rows to "Mail Sent" in a single batched `setValues()` call

This reduces email noise for faculty receiving 10+ assignments.

### Zero-wait queue
The frontend doesn't block on bulk dispatch:
```js
queueMails(ids)  →  pushes to taskQueue in chunks of 5
                 →  processNextInQueue() processes one chunk
                 →  on success, optimistically updates row badges
                 →  user keeps interacting with UI
```

### One-click webhook actions
Each email contains "Acknowledge" + "Mark Completed" buttons that hit the web-app URL with `?id=X&status=Y` params. `doGet` detects these params via `TextFinder` (faster than full sheet scan) and updates the row in <500 ms.

## 🚀 Setup

1. Create a Google Sheet with three tabs: `QSLIP`, `Faculty Details`, `LOG`
2. Extensions → Apps Script → paste `Code.gs`
3. Update the `CONFIG` constants at the top:
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE",
     FOLDER_ID_PDFS: "YOUR_DRIVE_FOLDER_ID_HERE",
     ...
   };
   ```
4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone
5. Copy the web app URL and open it

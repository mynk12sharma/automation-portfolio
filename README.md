# 🛠 Automation Portfolio — Mayank Sharma

A collection of **production Google Apps Script and Python automation tools** I built during my work in Assessment Operations at ALLEN Online (and earlier roles). These tools handle everything from real-time dashboards and bulk PDF generation to email automation and data scraping, serving **60,000+ students per month** across multiple competitive-exam programs (JEE Advanced, JEE Main, NEET, PNCF).

All projects in this repo have been **sanitized of company-specific data** (sheet IDs, folder IDs, internal email addresses) for public sharing. They're functional templates that can be adapted to any similar workflow.

---

## 📁 Projects

| # | Project | What it does | Tech |
|---|---------|--------------|------|
| 1 | [**Test Schedule Dashboard**](./01-test-schedule-dashboard) | Full-stack web app for tracking 1000+ tests across streams with milestone monitoring, HTML email reminders, syllabus PDF generation, and an issue-reporting system | Apps Script, HTML/CSS/JS |
| 2 | [**NEET Admit Card Generator**](./02-neet-admit-card-generator) | Generates pixel-perfect A4 admit card PDFs in bulk from a spreadsheet of student data | Apps Script, HTML/CSS |
| 3 | [**Attendance PDF Generator**](./03-attendance-pdf-generator) | Groups thousands of students by exam centre × paper, generates attendance PDFs into a nested Drive folder structure, with auto-resume on timeout | Apps Script |
| 4 | [**NEET Q-Slip Manager**](./04-neet-qslip-manager) | Web dashboard for assigning test-paper preparation tasks to faculty with HTML emails, PDF attachments, one-click status webhooks, and consolidated bulk dispatch | Apps Script, Tailwind, Vanilla JS |
| 5 | [**Syllabus PDF Generator**](./05-syllabus-pdf-generator) | Bulk-generates syllabus PDFs from a template sheet, with retry logic and date-organized Drive folders | Apps Script |
| 6 | [**Utility Scripts**](./06-utility-scripts) | UID generator + QID-to-video-dump duplicate-checking transfer tool | Apps Script |

---

## 🧰 Skills demonstrated

- **Google Apps Script (advanced)** — Web Apps with `doGet`, async `google.script.run` calls, `PropertiesService` for per-user and shared state, `GmailApp` HTML email, `DriveApp` folder hierarchies, `UrlFetchApp` for PDF export with retry/back-off, `LockService` for concurrent-safe writes, time-based triggers for long-running jobs
- **Front-end** — Responsive HTML/CSS dashboards with dark/light themes, filter bars, modal dialogs, toast notifications, sortable tables, real-time progress bars, Tailwind CSS
- **Workflow automation** — Resume-on-timeout patterns, exponential back-off, in-memory caching to minimize Drive API calls, bulk operations with single `setValues()` writes for performance
- **HTML email design** — Cross-client compatible templates with inline styles, tables, conditional formatting, and one-click action webhooks
- **Architectural patterns** — Configuration constants block, helper modularization, defensive `try/catch` everywhere, structured logging to dedicated log sheets

---

## 🚀 Real-world impact

- **99% delivery accuracy** maintained across 15+ exam programs serving 60,000+ students per month
- **90%+ time reduction** for paper PDF generation through Python automation (5–7 min → seconds per paper code)
- **60% reduction** in academic-coordinator workload through Q-Slip automation
- **2,000+ modules** digitized across 3 languages and 8 class levels in a single 6-month initiative

---

## 📜 License

MIT — see [LICENSE](./LICENSE). Use, fork, and adapt freely. Attribution appreciated but not required.

## 📬 Contact

**Mayank Sharma**
📍 Kota, Rajasthan
🔗 [LinkedIn](https://www.linkedin.com/in/mayank-sharma-3226471b9/)
✉️ mayank.sharma@gmail.com

# Utility Scripts

Small but useful utilities that solve specific operational pain points.

## 📁 Contents

### 1. `uid-generator.gs` — Batch UID Generator
Generates a UUID for every empty cell in column B (configurable). Reads the entire column in one go, fills empties in memory, writes back in one go — much faster than per-cell `getValue/setValue` loops.

**Use case:** Stamping unique IDs onto sheet rows for use as primary keys in downstream lookups (e.g., the Test Schedule Dashboard's `UID` column).

### 2. `jee-video-solutions-transfer.gs` — QID Duplicate-Check Transfer
Custom-menu tool that takes selected rows from a "Tracker" sheet and transfers matching QIDs from a "Qid Dump" sheet to a "Video Dump" sheet — **with duplicate prevention**.

**Logic:**
1. User checks boxes in column Q of the Tracker
2. For each checked row, reads the Status column (O) to see which subjects are marked "done" (Physics / Maths / Chem)
3. Looks up matching `(PaperCode, Subject)` pairs in the Qid Dump
4. Uses a `Set` of existing QIDs in Video Dump to skip duplicates
5. Bulk-appends only new QIDs in a single write

**Use case:** Building a queue of question IDs whose video solutions need to be created, without ever re-queuing one that's already in flight.

## 🚀 Setup

Each script is self-contained. Paste into a Google Sheet's Apps Script editor and update sheet/column names at the top.

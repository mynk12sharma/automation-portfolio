# 🚀 Step-by-Step: Pushing This to Your GitHub

This guide walks you through getting these projects onto your GitHub profile so recruiters can see them.

---

## Part 1 — Sanitize remaining files (one-time)

A few of your local files still contain real company data (sheet IDs, Drive folder IDs, the base64 logo, helpline numbers). **You need to manually copy your full local files into this repo and replace the IDs.**

### Files I've placed for you (already sanitized, ready to commit):
- ✅ `01-test-schedule-dashboard/Code.gs`
- ✅ `03-attendance-pdf-generator/Code.gs`
- ✅ `05-syllabus-pdf-generator/Code.gs`
- ✅ `06-utility-scripts/uid-generator.gs`
- ✅ `06-utility-scripts/jee-video-solutions-transfer.gs`

### Files you need to complete locally before committing:
1. **`01-test-schedule-dashboard/Index.html`** — Paste your full Index.html here. (No sensitive data inside — it's pure frontend.)
2. **`02-neet-admit-card-generator/Code.gs`** — Paste your full `buildHtml(d)` function into the placeholder. Replace `LOGO_BASE64` with `'PASTE_YOUR_BASE64_LOGO_HERE'` or remove the long string and add a note "Replace with your org logo's base64 string".
3. **`04-neet-qslip-manager/Code.gs`** — Paste your full implementation (all server functions + the `getDashboardHtml()` function with embedded HTML). Verify no real emails or phone numbers in the email-template strings.

### What to search-and-replace in YOUR copies before pasting:
| Find | Replace with |
|---|---|
| `1-IexwzweXZcrcwpcWmETLnefDLlZ6Jts9XIyrYNpY4U` | `YOUR_SHEET_ID_HERE` |
| `15HEczLH5FRtcGMncGEcGtpsjBncYh0Mp` | `YOUR_DRIVE_FOLDER_ID_HERE` |
| `1-3y7IXa4ncc5P5rMz5KY3nIEqvDvMTHj` | `YOUR_DRIVE_FOLDER_ID_HERE` |
| `1R8GBrHoj3nTdg-fP4_X9qSdLFUr3xYrm` | `YOUR_DRIVE_FOLDER_ID_HERE` |
| `1ffyIDxZfBJYySgqbGbtX8cLt5nzx2CvxTN-eHT3MyRk` | `YOUR_SPREADSHEET_ID_HERE` |
| `14rnQQtsuszP1riX34j1RNHTxIY0N6epF` | `YOUR_DRIVE_FOLDER_ID_HERE` |
| `wecare@allen.in` | `wecare@yourorg.com` (or similar generic) |
| `+91-9513736499` / `+91-9251688185` / `+91-9251688186` | `+91-XXXXXXXXXX` |
| `ALLEN`, `ALLEN ONLINE` | Leave if you want, OR replace with `YourOrg` (judgment call — see note below) |

**About the ALLEN brand name:** It's *probably* fine to leave references like "built for ALLEN Online" in documentation since you're describing your work. But avoid pretending to publish ALLEN's official tools. The safest framing is in this repo's README: "I built these during my role at ALLEN Online; this is my generic, sanitized version for portfolio purposes." If unsure, replace `ALLEN ONLINE` with `[Employer]` or your own placeholder.

---

## Part 2 — Install Git (if you don't have it)

**Windows:**
1. Download from https://git-scm.com/download/win
2. Install with default settings
3. Open "Git Bash" from Start menu

**Mac:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install git
```

Verify:
```bash
git --version
```

---

## Part 3 — Create GitHub account + repo

1. Go to https://github.com → Sign Up (use your `adityavaishnave@gmail.com`)
2. Choose a clean username (suggestion: `adityavaishnave` or `aditya-vaishnave`)
3. After signup, click **+ → New Repository**
4. Fill in:
   - **Repository name:** `automation-portfolio` (or `apps-script-portfolio`)
   - **Description:** "Production Google Apps Script and Python automation tools I built for large-scale EdTech assessment operations"
   - **Public** ✅
   - **Don't** initialize with README, license, or .gitignore (you already have them)
5. Click **Create repository**
6. Copy the URL shown (looks like `https://github.com/YOUR_USERNAME/automation-portfolio.git`)

---

## Part 4 — Push the code

Open a terminal (Git Bash on Windows) and run:

```bash
# Tell git who you are (first time only)
git config --global user.name "Aditya Vaishnave"
git config --global user.email "adityavaishnave@gmail.com"

# Go to your portfolio folder (extract the ZIP first)
cd /path/to/aditya-automation-portfolio

# Initialize git
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: production Apps Script automation portfolio"

# Connect to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/automation-portfolio.git

# Push
git push -u origin main
```

GitHub will ask you to log in. Modern GitHub doesn't accept password — you need a **Personal Access Token**:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Classic → check `repo` scope → Generate
3. Copy the token (you only see it once)
4. When git asks for password, paste the token

---

## Part 5 — Final polish

After pushing, your repo is live at:
`https://github.com/YOUR_USERNAME/automation-portfolio`

A few things to do:

1. **Add this URL to your resume** — the GitHub field at the top (`github.com/YOUR_USERNAME`)
2. **Pin this repository** on your GitHub profile (Profile → Customize Pins)
3. **Add a profile bio** — short version of your professional summary
4. **Take screenshots** of your dashboards while they're running and add them to each project's README (`![Dashboard](./screenshot.png)`). Visuals dramatically improve the impression.

---

## Part 6 — What this does for your resume

Once live, your resume's GitHub field is no longer empty. Recruiters who click will see:
- 6 substantial projects
- Real code (not placeholders)
- Clear READMEs explaining business impact
- Quantified outcomes (60K+ students, 90%+ time reduction)
- Modern tech (Apps Script web apps, Tailwind, vanilla JS, queue patterns)

This is a **major credibility boost** for Product Ops, Program Manager, and Data Analyst applications.

---

## Questions?

Common issues:
- **"Repository not found"** when pushing → check the URL has your actual username
- **Authentication failed** → use a Personal Access Token, not your password
- **`fatal: not a git repository`** → make sure you ran `git init` first
- **Want to update later?** → `git add .` → `git commit -m "Update X"` → `git push`

Good luck! 🎓

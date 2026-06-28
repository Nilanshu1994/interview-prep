# Interview Prep 📚

AI-powered interview Q&A, topic comparison, and JD-targeted prep.
Works on mobile, tablet, and desktop. Data syncs across all devices.

---

## What's new in this version

- 📱 **Full mobile & iPad support** — drawer sidebar, bottom nav, 44px tap targets, no horizontal scroll
- 🎨 **Redesigned UI** — Inter font, flashcard-style questions, answer reveal mechanic, warm colour palette
- 💡 **Tips per question** — each Q&A now includes 2-4 specific interview tips (what interviewers look for, common mistakes, follow-up questions)
- ♾ **No question limit** — generates 12-15 per difficulty, with a "Load more" button for unlimited questions
- 📄 **JD Prep** — paste a job description, get 15 role-targeted questions specific to that company and tech stack
- 📊 **Progress bar** — visual progress across all difficulty levels
- 🔢 **Question chip nav** — tap any numbered chip to jump directly to that question

---

## Setup from scratch (if you haven't set this up before)

See the full guide in the previous README or the cloudflare-worker/README.md.
Short version: Supabase (DB) + Cloudflare Worker (AI proxy) + GitHub Pages (hosting).

---

## UPDATING FROM A PREVIOUS VERSION

### Step 1 — Run the database migration (2 min)

Go to your Supabase project → **SQL Editor** → paste the contents of `MIGRATION.sql` → Run.

This adds the `tips` column to your questions table and creates the `jd_sessions` table.
It's safe to run even if you already have data — uses `add column if not exists`.

### Step 2 — Push the updated code

```bash
git add .
git commit -m "mobile UI, tips, JD prep, load more questions"
git push origin main
```

GitHub Actions rebuilds and deploys automatically (~2 min). Your existing topics, notes, and comparisons are untouched.

---

## How to use each feature

### Study tab
- Select a topic from the sidebar (desktop) or tap Topics → then a topic (mobile)
- Choose difficulty: Basic / Intermediate / Advanced
- Read the question → tap **Show Answer →** to reveal (think first!)
- Tap **💡 Interview Tips** to see what interviewers actually look for
- Tap **↻ New question** to swap the current one for a fresh one
- Tap **+ Load more questions** at the bottom to generate an additional batch (unlimited)
- Number chips at the bottom let you jump to any question directly

### Compare tab
- Pick two topics from the dropdowns
- Tap Compare → — wait ~15 seconds
- Each shared concept is an accordion — tap to expand and see code side-by-side
- Results are cached in Supabase — loads instantly on repeat visits

### JD Prep tab
- Paste a full job description into the text area
- Tap **Generate Prep Questions →**
- The AI extracts role, level, tech stack, responsibilities — then generates 15 targeted questions
- Past sessions are saved and listed below — tap any to resume
- Progress (reviewed/total) shown per session

### Admin mode (add/delete topics)
- Click/tap 🔒 in the sidebar header → enter your PIN → 🔓 unlocked
- Add input and 🗑 delete buttons appear
- Admin mode lasts until you close the tab

---

## Running locally

```bash
cp .env.example .env
# Fill in REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY,
# REACT_APP_PROXY_URL, REACT_APP_ADMIN_PIN

npm install
npm start
```

---

## Project structure

```
interview-prep/
├── cloudflare-worker/
│   ├── worker.js          — AI proxy (holds GH token in Cloudflare secrets)
│   ├── wrangler.toml
│   └── README.md
├── public/
│   ├── index.html         — Inter font, mobile meta tags
│   └── favicon.svg
├── src/
│   ├── App.js             — responsive shell, drawer, bottom nav, tabs
│   ├── api.js             — AI calls: questions (with tips), comparison, JD analysis
│   ├── supabase.js        — all DB ops including JD sessions
│   ├── useStore.js        — all state management
│   ├── index.css          — design system: tokens, layout, mobile breakpoints, animations
│   └── components/
│       ├── Sidebar.js     — mobile drawer, topic list, admin PIN lock
│       ├── PinModal.js    — PIN entry dialog
│       ├── QuestionView.js — flashcard UI, answer reveal, tips, load more, chip nav
│       ├── CompareView.js  — responsive two-column comparison
│       └── JDView.js      — JD input, analysis, Q&A, session history
├── MIGRATION.sql          — run this in Supabase to update existing DB
├── .github/workflows/deploy.yml
├── .env.example
└── package.json
```

---

## Troubleshooting

**Questions have no tips** → Old questions were generated without tips. Tap **↻ New question** to regenerate with tips, or delete the difficulty and regenerate fresh (tap a different difficulty, then switch back — it'll regenerate).

**JD Prep tab shows error** → Check `REACT_APP_PROXY_URL` is set in GitHub secrets. The proxy must be deployed.

**Mobile layout looks broken** → Hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If still broken, clear site data in browser settings.

**"Database error" on load** → Supabase credentials wrong or MIGRATION.sql not run yet.

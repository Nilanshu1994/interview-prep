# Interview Prep 📚

AI-powered interview Q&A for software engineers.
Open the URL, study your topics. Data syncs across all devices via Supabase.
Only you can add or delete topics (PIN-protected).

---

## What's new in this version

- ✅ **Delete topics** — trash icon appears when you unlock admin mode, with a two-tap confirm so you can't accidentally delete
- 🔒 **PIN protection** — a lock icon in the sidebar lets only you add/delete topics; anyone else can still study
- 🖼 **Favicon** — the app now has a blue book icon in the browser tab
- 🔓 **Viewer mode** — public visitors can browse and study all topics freely

---

## Complete setup guide (from scratch)

You have already done steps 1–3 from the previous version (Supabase project + tables + GitHub repo).
This guide covers everything end-to-end so you can follow it fully if needed.

---

### STEP 1 — Create a free Supabase project

> Skip this if you already have a Supabase project with the tables set up.

1. Go to https://supabase.com → sign up free (no credit card)
2. Click **New project**, give it a name, set a DB password, click **Create project**
3. Wait about 1 minute for it to provision
4. Go to **SQL Editor** (left sidebar) → paste and run this:

```sql
create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  q text not null,
  a text not null,
  reviewed boolean default false,
  note text default '',
  position integer default 0,
  created_at timestamptz default now()
);

alter table topics enable row level security;
alter table questions enable row level security;

create policy "allow all" on topics for all using (true) with check (true);
create policy "allow all" on questions for all using (true) with check (true);
```

5. Go to **Settings → API** → copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

### STEP 2 — Get a free GitHub token for AI generation

> Skip this if you already have a `ghp_` token from the previous version. Same token works.

1. Go to https://github.com/settings/tokens/new
2. Give it any name (e.g. `interview-prep`), set expiration to **No expiration**
3. **No scopes needed** — scroll straight to **Generate token**
4. Copy the token (starts with `ghp_`)

---

### STEP 3 — Pick your admin PIN

Choose any 4–8 digit number that only you know. You'll use it to unlock add/delete in the app.
Example: `8472` — write it down somewhere safe.

---

### STEP 4 — Add your GitHub repo secrets

This is how the build system gets your keys without exposing them in code.

1. Go to your GitHub repo → **Settings** (top tab) → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these four, one at a time:

   | Secret name                  | Value                                      |
   |------------------------------|--------------------------------------------|
   | `REACT_APP_SUPABASE_URL`     | Your Supabase Project URL                  |
   | `REACT_APP_SUPABASE_ANON_KEY`| Your Supabase anon key                     |
   | `REACT_APP_GH_TOKEN`         | Your GitHub token (`ghp_...`)              |
   | `REACT_APP_ADMIN_PIN`        | Your chosen PIN (e.g. `8472`)              |

---

### STEP 5 — Push this updated code to GitHub

Unzip the downloaded file. You'll see the `interview-prep/` folder.
Open a terminal inside that folder and run:

```bash
# If you already have the repo set up from before:
git add .
git commit -m "add delete, PIN security, favicon"
git push origin main
```

```bash
# If you are setting up fresh (first time):
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/interview-prep.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

### STEP 6 — Enable GitHub Pages (first time only)

> Skip this if GitHub Pages was already working from the previous version.

1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Branch**, select `gh-pages` → `/ (root)` → click **Save**

---

### STEP 7 — Wait for the build to finish

1. Go to your repo → **Actions** tab
2. You'll see a workflow running called **Deploy to GitHub Pages**
3. Wait for the green tick (takes about 2 minutes)
4. Your app is live at: `https://YOUR_USERNAME.github.io/interview-prep`

Every time you push to `main`, the site auto-updates. No manual deploy needed.

---

## How to run locally (optional)

If you want to test on your machine before pushing:

```bash
# Create a .env file (copy the example and fill in your values)
cp .env.example .env
# Edit .env and put in your real Supabase URL, anon key, GitHub token, and PIN

npm install
npm start
# Opens at http://localhost:3000
```

---

## How the admin PIN works

| Who | What they see | What they can do |
|-----|--------------|-----------------|
| Anyone | All topics, all questions | Study, read answers, nothing else |
| You (after PIN) | Everything + 🗑 delete buttons + Add input | Add topics, delete topics |

**To unlock admin mode:**
1. Click the 🔒 lock icon in the top-right of the sidebar
2. Enter your PIN → click Unlock
3. The lock turns to 🔓 and admin controls appear
4. To lock again: click 🔓 → locks immediately
5. Admin mode auto-expires when you close the tab (uses sessionStorage)

**To delete a topic:**
1. Unlock admin mode (🔒 → enter PIN)
2. Click 🗑 next to a topic — it turns red and says "Tap 🗑 again to confirm"
3. Click 🗑 again within 3 seconds — topic and all its questions/notes are permanently deleted
4. Click anywhere else to cancel

---

## Project structure

```
interview-prep/
├── public/
│   ├── index.html           — HTML shell with favicon link
│   └── favicon.svg          — Blue book icon for browser tab
├── src/
│   ├── App.js               — Root layout, loading state, sync banner
│   ├── api.js               — GitHub Models AI calls (question generation)
│   ├── supabase.js          — All database operations (load, add, delete, update)
│   ├── useStore.js          — State management, ties Supabase + UI together
│   ├── index.css            — CSS variables (light + dark theme)
│   ├── index.js             — React entry point
│   └── components/
│       ├── Sidebar.js       — Topic list, search, PIN lock, add/delete (admin only)
│       ├── PinModal.js      — PIN entry dialog
│       └── QuestionView.js  — Questions, answers, notes, difficulty tabs, navigation
├── .github/
│   └── workflows/
│       └── deploy.yml       — Auto-deploy to GitHub Pages on every push to main
├── .env.example             — Template for your environment variables
├── package.json
└── README.md
```

---

## Troubleshooting

**Blank screen after deploy**
→ Check the Actions tab for build errors. Usually means a secret is missing or wrong.

**"Database error" on load**
→ Your Supabase URL or anon key is wrong. Double-check the secrets in GitHub repo settings.

**Questions not generating**
→ Your `REACT_APP_GH_TOKEN` is wrong, expired, or missing. Generate a new one at github.com/settings/tokens.

**PIN not working**
→ The `REACT_APP_ADMIN_PIN` secret in GitHub doesn't match what you're entering. Remember it's digits only.

**Delete button not showing**
→ You need to unlock admin mode first — click the 🔒 icon in the sidebar and enter your PIN.

**Data not showing on a second device**
→ Both devices must be using the same deployed URL (your GitHub Pages URL). Don't use localhost on one and GitHub Pages on the other.

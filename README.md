# Interview Prep 📚

AI-powered interview Q&A + topic comparison for software engineers.
Syncs across all devices. PIN-protected admin. No paid services.

---

## What's new in this version

- 🔒 **GitHub token moved to Cloudflare Worker** — token never touches your repo or build
- ⚖ **Compare tab** — pick any two topics and get a full side-by-side breakdown
- 🗑 **Delete topics** — trash icon in admin mode with two-tap confirm
- 🖼 **Favicon** — browser tab icon

---

## Full setup guide

You need four free things:
1. Supabase account (database)
2. Cloudflare account (AI proxy — fixes the token problem)
3. GitHub account (hosting + AI models)
4. This repo pushed to GitHub

---

### STEP 1 — Supabase database

> Skip if already done from a previous version — but run the new SQL for comparisons.

1. Go to https://supabase.com → sign up → New project
2. **SQL Editor** → run this (includes the new comparisons table):

```sql
-- Topics
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Questions
create table if not exists questions (
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

-- Comparisons (NEW)
create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  topic_a text not null,
  topic_b text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  unique(topic_a, topic_b)
);

-- Row Level Security (allow public read/write for personal use)
alter table topics      enable row level security;
alter table questions   enable row level security;
alter table comparisons enable row level security;

create policy "allow all" on topics      for all using (true) with check (true);
create policy "allow all" on questions   for all using (true) with check (true);
create policy "allow all" on comparisons for all using (true) with check (true);
```

3. **Settings → API** → copy Project URL and anon public key

---

### STEP 2 — Cloudflare Worker (fixes the GitHub token problem)

This is the key fix. The worker holds your GitHub token encrypted in Cloudflare —
it never appears in your code, your repo, or your build output.

#### 2a — Create a free Cloudflare account
https://cloudflare.com → sign up free (no credit card for Workers)

#### 2b — Get a GitHub token for AI generation
https://github.com/settings/tokens/new → any name → No expiration → no scopes → Generate → copy it

#### 2c — Install Wrangler and deploy the worker

```bash
# Install Cloudflare CLI
npm install -g wrangler

# Log in (opens browser)
wrangler login

# Go to the worker folder
cd cloudflare-worker

# Store your GitHub token as an encrypted secret (paste when prompted)
wrangler secret put GH_TOKEN

# Edit worker.js — find this line and uncomment + fill in your GitHub Pages URL:
#   // 'https://YOUR_USERNAME.github.io',
# Change to (example):
#   'https://nilanshu.github.io',

# Deploy
wrangler deploy
```

You'll see:
```
✅ Deployed to: https://interview-prep-proxy.YOUR_SUBDOMAIN.workers.dev
```

**Copy that URL — you need it in Step 3.**

#### 2d — Test the worker works
```bash
curl -X POST https://interview-prep-proxy.YOUR_SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://YOUR_USERNAME.github.io" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"say hi"}],"max_tokens":10}'
```
You should get a JSON response with a greeting. If you get 403, check the ALLOWED_ORIGINS in worker.js.

---

### STEP 3 — Add GitHub repo secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these four secrets:

| Secret name                   | Value                                              |
|-------------------------------|----------------------------------------------------|
| `REACT_APP_SUPABASE_URL`      | Your Supabase Project URL                          |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key                             |
| `REACT_APP_PROXY_URL`         | Your Cloudflare Worker URL from Step 2c            |
| `REACT_APP_ADMIN_PIN`         | Any 4–8 digit PIN only you know (e.g. `7391`)     |

**Remove `REACT_APP_GH_TOKEN` if it exists** — it's no longer used and caused the scanning issue.

---

### STEP 4 — Push the updated code

```bash
# From inside the interview-prep folder:
git add .
git commit -m "cloudflare proxy, compare feature, delete topics"
git push origin main
```

GitHub Actions builds and deploys automatically (~2 minutes).
Watch progress under the **Actions** tab in your repo.

---

### STEP 5 — Local dev setup (optional)

```bash
cp .env.example .env
# Fill in .env with your real values

npm install
npm start
# Opens at http://localhost:3000
```

For local dev, the Cloudflare worker needs `http://localhost:3000` in its ALLOWED_ORIGINS.
It's already there by default in worker.js.

---

## How to use the Compare feature

1. Add at least 2 topics in the sidebar (e.g. "Python" and "Node.js")
2. Click the **⚖ Compare** tab at the top of the main area
3. Pick Topic A and Topic B from the dropdowns
4. Click **Compare →**
5. Wait ~15 seconds for generation (it's doing a lot of work)
6. You get:
   - **Overview** — what both are and when to use each
   - **Shared concepts** — 8-10 concepts (classes, async, error handling…) shown side by side with real code and key differences. Click any concept to expand it.
   - **Unique features** — what each has that the other doesn't
   - **When to use** — decision guidance
7. Comparisons are **saved to Supabase** — next time you compare the same pair it loads instantly
8. Click **↻ Regenerate** to get a fresh comparison
9. Click **⬇ Export** to copy everything to clipboard

---

## How the admin PIN works

| Who | Can do |
|-----|--------|
| Anyone | Browse topics, study Q&As, read answers, use Compare |
| You (after PIN) | Add topics, delete topics |

- Click **🔒** in sidebar → enter PIN → **🔓** admin mode
- Admin mode lasts until you close the tab or click 🔓 to re-lock
- To delete: click 🗑 → row turns red → click 🗑 again within 3 seconds to confirm

---

## Rotating your GitHub token

If your token expires or needs replacing:
```bash
cd cloudflare-worker
wrangler secret put GH_TOKEN
# Paste new token → Enter
# No redeploy needed — takes effect immediately
```

---

## Project structure

```
interview-prep/
├── cloudflare-worker/
│   ├── worker.js          — the proxy (holds GH token, never in your repo)
│   ├── wrangler.toml      — Cloudflare config
│   └── README.md          — worker-specific setup guide
├── public/
│   ├── index.html
│   └── favicon.svg
├── src/
│   ├── App.js             — root, Study/Compare tabs, sync banner
│   ├── api.js             — calls proxy for questions + comparisons
│   ├── supabase.js        — all DB operations incl. comparisons
│   ├── useStore.js        — all state management
│   ├── index.css          — CSS variables, light/dark
│   ├── index.js
│   └── components/
│       ├── Sidebar.js     — topics, PIN lock, add/delete
│       ├── PinModal.js    — PIN entry dialog
│       ├── QuestionView.js — questions, answers, notes, nav
│       └── CompareView.js  — two-column comparison renderer
├── .github/workflows/deploy.yml
├── .env.example
├── package.json
└── README.md
```

---

## Troubleshooting

**Build fails / Actions error**
→ Check that all 4 secrets exist in repo settings. Missing secret = blank value = build may fail.

**"Proxy error 403"**
→ Your GitHub Pages URL isn't in ALLOWED_ORIGINS in worker.js. Add it, then `wrangler deploy` again.

**"PROXY_URL_MISSING" error in app**
→ `REACT_APP_PROXY_URL` secret is missing or blank in GitHub repo secrets.

**Compare takes too long / times out**
→ It's doing a large generation. Cloudflare Workers have a 30s CPU limit on free tier. If it consistently times out, try comparing simpler/shorter topic names.

**Comparison not saving**
→ The `comparisons` table might not exist yet. Run the SQL from Step 1 again (uses `create table if not exists` so it's safe to re-run).

**Delete button not showing**
→ You need to unlock admin mode first. Click 🔒 in the sidebar.

**Data missing on second device**
→ Make sure both devices use the same deployed GitHub Pages URL, not localhost.

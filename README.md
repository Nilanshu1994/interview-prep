# Interview Prep 📚

AI-powered interview Q&A study tool for software engineers.  
Uses **GitHub Models** (free) — no credit card, no paid API.

---

## What it does

- Add any topic (Django ORM, Kubernetes, PostgreSQL, System Design…)
- Get 10 AI-generated interview questions per difficulty level (Basic / Intermediate / Advanced)
- One question per page with Prev / Next navigation
- Mark questions as reviewed, add your own notes
- Regenerate any question for a fresh one
- Export all Q&A + notes to clipboard (paste into Notion, Obsidian, etc.)
- Dark mode
- All data saved in your browser (localStorage)

---

## Step 1 — Get your free GitHub token

1. Go to → https://github.com/settings/tokens/new
2. Give it any name (e.g. "interview-prep")
3. **No scopes needed** — just scroll down and click **Generate token**
4. Copy the token (starts with `ghp_`)

You paste this into the app on first launch. It's saved to your browser only.

---

## Step 2 — Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start
```

Opens at http://localhost:3000

---

## Step 3 — Host free on GitHub Pages (permanent URL, any device)

### 3a. Create a GitHub repo

1. Go to https://github.com/new
2. Name it `interview-prep` (or anything you like)
3. Set it to **Public** (required for free GitHub Pages)
4. Click **Create repository**

### 3b. Add your repo URL to package.json

Open `package.json` and update the `homepage` field:

```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/interview-prep",
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

### 3c. Push your code

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/interview-prep.git
git push -u origin main
```

### 3d. Deploy to GitHub Pages

```bash
npm run deploy
```

This builds the app and pushes it to the `gh-pages` branch automatically.

### 3e. Enable GitHub Pages in repo settings

1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Branch**, select `gh-pages` → `/ (root)` → click **Save**
4. Wait ~2 minutes, then visit:
   `https://YOUR_GITHUB_USERNAME.github.io/interview-prep`

That's your permanent URL — works on any device, any browser, forever free.

---

## Updating the app later

Whenever you make changes:

```bash
npm run deploy
```

That's it. The live site updates in ~1 minute.

---

## Project structure

```
interview-prep/
├── public/
│   └── index.html          # HTML shell
├── src/
│   ├── index.js            # React entry point
│   ├── index.css           # Global styles + CSS variables
│   ├── App.js              # Root component
│   ├── api.js              # GitHub Models API calls
│   ├── useStore.js         # State management + localStorage
│   └── components/
│       ├── Sidebar.js      # Topic list + search + add
│       ├── QuestionView.js # Study area (questions, answers, notes, nav)
│       └── TokenModal.js   # GitHub token setup screen
├── package.json
└── README.md
```

---

## Tech stack

| Thing | What |
|---|---|
| UI | React 18 |
| AI | GitHub Models (gpt-4o-mini, free) |
| Hosting | GitHub Pages (free) |
| Data | Browser localStorage |
| Styling | Plain CSS with CSS variables |
| Build | Create React App |
| Deploy | gh-pages npm package |

---

## Troubleshooting

**"401 Unauthorized"** — Your GitHub token is wrong or expired. Click "🔑 Change token" and generate a new one.

**"Rate limit"** — GitHub Models has a free daily limit. Wait a few minutes and try again.

**Blank page after deploy** — Make sure the `homepage` in `package.json` matches your exact GitHub Pages URL.

**Questions not saving** — localStorage is per-browser. Data on your laptop won't appear on your phone. Use Export to copy and paste your notes across.

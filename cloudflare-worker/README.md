# Cloudflare Worker — AI Proxy

This tiny worker is the fix for GitHub blocking your token.
It runs on Cloudflare's edge (free tier: 100,000 requests/day) and holds
your GitHub token in an encrypted secret store — completely outside your repo.

---

## Deploy in 5 steps (one-time, ~5 minutes)

### Step 1 — Create a free Cloudflare account
Go to https://cloudflare.com → sign up free. No credit card needed for Workers.

### Step 2 — Install Wrangler (Cloudflare's CLI)
```bash
npm install -g wrangler
```

### Step 3 — Log in to Cloudflare
```bash
wrangler login
# Opens your browser → click Allow
```

### Step 4 — Add your GitHub token as an encrypted secret
```bash
cd cloudflare-worker
wrangler secret put GH_TOKEN
# Paste your ghp_... token when prompted → Enter
# The token is now stored encrypted in Cloudflare — never in any file
```

### Step 5 — Edit worker.js, then deploy

Open `worker.js` and find this line near the top:
```js
// 'https://YOUR_USERNAME.github.io',   <-- uncomment and fill in before deploying
```
Uncomment it and replace `YOUR_USERNAME` with your actual GitHub username.
Save the file, then:

```bash
wrangler deploy
```

You'll see output like:
```
✅ Deployed to: https://interview-prep-proxy.YOUR_CF_SUBDOMAIN.workers.dev
```

**Copy that URL** — you need it in the next step.

---

## After deploy — tell your React app to use the worker

Open `.env` in your React project and add:
```
REACT_APP_PROXY_URL=https://interview-prep-proxy.YOUR_CF_SUBDOMAIN.workers.dev
```

Also add `REACT_APP_PROXY_URL` as a GitHub repo secret (same place as your
Supabase secrets) so the deployed build uses it too.

Then remove `REACT_APP_GH_TOKEN` from your `.env` and from GitHub secrets —
the token now lives only in Cloudflare, not in your build.

---

## How it works

```
React app
  │  POST /chat/completions  (no token)
  ▼
Cloudflare Worker  (adds Authorization: Bearer ghp_... from its secret store)
  │
  ▼
GitHub Models API  (gets the real token, returns AI response)
  │
  ▼
Cloudflare Worker  (strips nothing, returns response as-is)
  │
  ▼
React app  (gets the AI response, token never seen)
```

---

## Updating the worker later

If you ever need to rotate your GitHub token:
```bash
cd cloudflare-worker
wrangler secret put GH_TOKEN
# Paste new token → Enter → done instantly, no redeploy needed
```

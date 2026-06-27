/**
 * Cloudflare Worker — AI Proxy
 *
 * Sits between your React app and GitHub Models.
 * Holds the GitHub token in Cloudflare's encrypted secret store.
 * The token never touches your React build or your GitHub repo.
 *
 * Deploy instructions are in cloudflare-worker/README.md
 */

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';

// Your React app's GitHub Pages origin — only this origin can call this worker.
// Set this to your actual deployed URL after you know it.
// Example: 'https://nilanshu.github.io'
// During local dev, also allow localhost.
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://nilanshu1994.github.io',   // <-- uncomment and fill in before deploying
];

export default {
  async fetch(request, env) {

    const origin = request.headers.get('Origin') || '';

    // ── CORS pre-flight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, origin);
    }

    // ── Only allow POST ────────────────────────────────────────────────────────
    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, origin);
    }

    // ── Origin check ───────────────────────────────────────────────────────────
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return corsResponse(JSON.stringify({ error: 'Forbidden origin' }), 403, origin);
    }

    // ── Forward to GitHub Models with the secret token ─────────────────────────
    try {
      const body = await request.text();

      const upstream = await fetch(GITHUB_MODELS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GH_TOKEN}`,   // ← secret, never in frontend
        },
        body,
      });

      const data = await upstream.text();
      return corsResponse(data, upstream.status, origin, upstream.headers.get('Content-Type'));

    } catch (err) {
      return corsResponse(JSON.stringify({ error: err.message }), 500, origin);
    }
  },
};

// ── Helper: wrap any response with the right CORS headers ─────────────────────
function corsResponse(body, status, origin, contentType = 'application/json') {
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': contentType,
  };
  return new Response(body, { status, headers });
}

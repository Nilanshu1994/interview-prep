/**
 * api.js — all AI calls go through the Cloudflare Worker proxy.
 *
 * The proxy URL is the only env var needed here.
 * The actual GitHub token lives in Cloudflare's encrypted secret store
 * and is NEVER baked into this build.
 *
 * Set REACT_APP_PROXY_URL in:
 *   - .env (local dev)
 *   - GitHub repo secrets (for the Actions build → GitHub Pages)
 */

const PROXY_URL = process.env.REACT_APP_PROXY_URL || '';
const MODEL     = 'gpt-4o-mini';

async function callModel(messages, max_tokens = 8000) {
  if (!PROXY_URL) throw new Error('PROXY_URL_MISSING');

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Proxy error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Parse helpers ────────────────────────────────────────────────────────────

function parseJsonArray(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('['), ei = clean.lastIndexOf(']');
  if (si < 0 || ei < 0) throw new Error('Model did not return a JSON array. Please retry.');
  return JSON.parse(clean.slice(si, ei + 1));
}

function parseJsonObject(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('{'), ei = clean.lastIndexOf('}');
  if (si < 0 || ei < 0) throw new Error('Model did not return a JSON object. Please retry.');
  return JSON.parse(clean.slice(si, ei + 1));
}

// ── Question generation ──────────────────────────────────────────────────────

export async function generateQuestions(topic, difficulty) {
  const label = {
    easy:   'basic/foundational',
    medium: 'intermediate',
    hard:   'advanced/expert-level',
  }[difficulty];

  const prompt =
    `You are a senior engineering interviewer. Generate exactly 10 ${label} interview questions ` +
    `on the topic "${topic}" for a software engineer with 8 years of experience.\n\n` +
    `Return ONLY a raw JSON array. No markdown, no backticks, no explanation.\n` +
    `Each item: { "q": "question", "a": "detailed answer — plain paragraphs, ` +
    `triple-backtick code blocks where needed, ASCII diagrams for architecture topics" }\n` +
    `Start directly with [ and end with ]`;

  const text = await callModel([{ role: 'user', content: prompt }], 8000);
  const qs   = parseJsonArray(text);
  return qs.map(q => ({ q: q.q, a: q.a, reviewed: false, note: '' }));
}

export async function regenerateOne(topic, difficulty, existingQuestions) {
  const label    = { easy:'basic/foundational', medium:'intermediate', hard:'advanced/expert-level' }[difficulty];
  const existing = existingQuestions.map(q => q.q).join('\n');

  const prompt =
    `Generate 1 new ${label} interview question on "${topic}" for an 8-year experienced engineer.\n` +
    `Must be completely different from:\n${existing}\n\n` +
    `Return ONLY a JSON object, no markdown: {"q":"...","a":"..."}`;

  const text = await callModel([{ role: 'user', content: prompt }], 2000);
  const q    = parseJsonObject(text);
  return { q: q.q, a: q.a, reviewed: false, note: '' };
}

// ── Comparison generation ────────────────────────────────────────────────────

export async function generateComparison(topicA, topicB) {
  const prompt =
    `You are a senior software engineering educator comparing "${topicA}" and "${topicB}" ` +
    `for an engineer with 8 years of experience preparing for interviews.\n\n` +
    `Return ONLY a raw JSON object — no markdown, no backticks, no explanation.\n\n` +
    `Schema:\n` +
    `{\n` +
    `  "summary": "2-3 sentence overview of both topics and when you would use each",\n` +
    `  "shared_concepts": [\n` +
    `    {\n` +
    `      "concept": "concept name (e.g. Classes, Async, Error Handling, Modules)",\n` +
    `      "topic_a": { "explanation": "how ${topicA} handles this", "code": "working code example" },\n` +
    `      "topic_b": { "explanation": "how ${topicB} handles this", "code": "working code example" },\n` +
    `      "difference": "key difference or gotcha between the two approaches"\n` +
    `    }\n` +
    `  ],\n` +
    `  "only_in_a": ["feature or concept unique to ${topicA}"],\n` +
    `  "only_in_b": ["feature or concept unique to ${topicB}"],\n` +
    `  "when_to_use_a": "paragraph on when to choose ${topicA}",\n` +
    `  "when_to_use_b": "paragraph on when to choose ${topicB}"\n` +
    `}\n\n` +
    `Requirements:\n` +
    `- shared_concepts must have 8-10 items covering the most interview-relevant concepts\n` +
    `- Code examples must be real, runnable, and show the same operation in both languages\n` +
    `- only_in_a and only_in_b must have 4-6 items each\n` +
    `- Be specific and technical — this is for experienced engineers, not beginners`;

  const text = await callModel([{ role: 'user', content: prompt }], 8000);
  return parseJsonObject(text);
}

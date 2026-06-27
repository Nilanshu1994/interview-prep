// GitHub Models — free AI inference (no billing, just a GitHub account)
// Docs: https://docs.github.com/en/github-models
const ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const MODEL    = 'gpt-4o-mini';

// Token comes from .env — baked into the build at deploy time.
// Users never see or enter it.
const TOKEN = process.env.REACT_APP_GH_TOKEN || '';

async function callModel(messages, max_tokens = 8000) {
  if (!TOKEN) throw new Error('GH_TOKEN_MISSING');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateQuestions(topic, difficulty) {
  const label = { easy: 'basic/foundational', medium: 'intermediate', hard: 'advanced/expert-level' }[difficulty];

  const prompt = `You are a senior engineering interviewer. Generate exactly 10 ${label} interview questions on the topic "${topic}" for a software engineer with 8 years of experience.

Return ONLY a raw JSON array. No markdown, no backticks, no explanation before or after.
Each item: { "q": "question text", "a": "detailed answer — plain paragraphs, triple-backtick code blocks where needed, ASCII diagrams for architecture topics" }
Start directly with [ and end with ]`;

  const text = await callModel([{ role: 'user', content: prompt }], 8000);
  const clean = text.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('['), ei = clean.lastIndexOf(']');
  if (si < 0 || ei < 0) throw new Error('Model did not return a JSON array. Please retry.');
  const qs = JSON.parse(clean.slice(si, ei + 1));
  return qs.map(q => ({ q: q.q, a: q.a, reviewed: false, note: '' }));
}

export async function regenerateOne(topic, difficulty, existingQuestions) {
  const label = { easy: 'basic/foundational', medium: 'intermediate', hard: 'advanced/expert-level' }[difficulty];
  const existing = existingQuestions.map(q => q.q).join('\n');

  const prompt = `Generate 1 new ${label} interview question on "${topic}" for an 8-year experienced engineer.
Must be different from:\n${existing}\n
Return ONLY a JSON object, no markdown: {"q":"...","a":"..."}`;

  const text = await callModel([{ role: 'user', content: prompt }], 2000);
  const clean = text.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('{'), ei = clean.lastIndexOf('}');
  const q = JSON.parse(clean.slice(si, ei + 1));
  return { q: q.q, a: q.a, reviewed: false, note: '' };
}

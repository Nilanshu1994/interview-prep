// GitHub Models — free inference endpoint
// Docs: https://docs.github.com/en/github-models
const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const MODEL = 'gpt-4o-mini'; // free, fast, good quality

export async function generateQuestions(topic, difficulty, existingQuestions = []) {
  const token = localStorage.getItem('gh_token');
  if (!token) throw new Error('NO_TOKEN');

  const diffLabel = {
    easy: 'basic/foundational',
    medium: 'intermediate',
    hard: 'advanced/expert-level',
  }[difficulty];

  const prompt = `You are a senior engineering interviewer. Generate exactly 10 ${diffLabel} interview questions on the topic "${topic}" for a software engineer with 8 years of experience.

Return ONLY a raw JSON array. No markdown, no backticks, no explanation. Each item must have:
- "q": the interview question
- "a": a detailed, accurate answer written in plain paragraphs. For code, use triple-backtick blocks. Include ASCII diagrams for architecture/flow topics. Be thorough.

Start directly with [ and end with ]`;

  const res = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `API error ${res.status}`;
    if (res.status === 401) throw new Error('BAD_TOKEN');
    throw new Error(msg);
  }

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || '';
  text = text.replace(/```json|```/g, '').trim();
  const si = text.indexOf('[');
  const ei = text.lastIndexOf(']');
  if (si < 0 || ei < 0) throw new Error('Response did not contain a JSON array. Try again.');
  const questions = JSON.parse(text.slice(si, ei + 1));
  return questions.map((q) => ({ q: q.q, a: q.a, reviewed: false, note: '' }));
}

export async function regenerateOne(topic, difficulty, existingQuestions) {
  const token = localStorage.getItem('gh_token');
  if (!token) throw new Error('NO_TOKEN');

  const diffLabel = {
    easy: 'basic/foundational',
    medium: 'intermediate',
    hard: 'advanced/expert-level',
  }[difficulty];

  const existing = existingQuestions.map((q) => q.q).join('\n');

  const prompt = `You are a senior engineering interviewer. Generate 1 new ${diffLabel} interview question on "${topic}" for an 8-year experienced engineer.
It must be completely different from:\n${existing}\n
Return ONLY a raw JSON object with no markdown:\n{"q":"...","a":"..."}`;

  const res = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || '';
  text = text.replace(/```json|```/g, '').trim();
  const si = text.indexOf('{');
  const ei = text.lastIndexOf('}');
  const q = JSON.parse(text.slice(si, ei + 1));
  return { q: q.q, a: q.a, reviewed: false, note: '' };
}

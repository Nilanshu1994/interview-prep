const PROXY_URL = process.env.REACT_APP_PROXY_URL || '';
const MODEL     = 'gpt-4o-mini';

async function callModel(messages, max_tokens = 12000) {
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

function parseArray(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('['), ei = clean.lastIndexOf(']');
  if (si < 0 || ei < 0) throw new Error('Model did not return a JSON array. Please retry.');
  return JSON.parse(clean.slice(si, ei + 1));
}

function parseObject(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const si = clean.indexOf('{'), ei = clean.lastIndexOf('}');
  if (si < 0 || ei < 0) throw new Error('Model did not return a JSON object. Please retry.');
  return JSON.parse(clean.slice(si, ei + 1));
}

// ── Questions ─────────────────────────────────────────────────────────────────
// Now generates 15 questions (no artificial limit) with tips field
export async function generateQuestions(topic, difficulty) {
  const label = {
    easy:   'basic/foundational',
    medium: 'intermediate',
    hard:   'advanced/expert-level',
  }[difficulty];

  const prompt =
`You are a senior engineering interviewer and coach.
Generate ${difficulty === 'easy' ? 12 : difficulty === 'medium' ? 15 : 15} ${label} interview questions on "${topic}" for a software engineer with 8 years of experience.

Return ONLY a raw JSON array. No markdown, no backticks, no preamble. Start with [ end with ]

Each item must have exactly these fields:
{
  "q": "the interview question",
  "a": "comprehensive answer — use plain paragraphs. For code use triple-backtick blocks with language hint. Use ASCII diagrams for system/architecture topics.",
  "tips": ["2-4 short, specific interview tips for this exact question — what interviewers actually look for, common mistakes, follow-up questions to expect, how to structure your answer"]
}

Tips must be concrete and specific to the question, not generic advice.`;

  const text = await callModel([{ role: 'user', content: prompt }], 12000);
  const qs   = parseArray(text);
  return qs.map(q => ({ q: q.q, a: q.a, tips: q.tips || [], reviewed: false, note: '' }));
}

// ── Regenerate one ────────────────────────────────────────────────────────────
export async function regenerateOne(topic, difficulty, existingQuestions) {
  const label    = { easy:'basic/foundational', medium:'intermediate', hard:'advanced/expert-level' }[difficulty];
  const existing = existingQuestions.map(q => q.q).join('\n');

  const prompt =
`Generate 1 new ${label} interview question on "${topic}" for an 8-year experienced engineer.
Must be completely different from:\n${existing}

Return ONLY a JSON object, no markdown:
{"q":"...","a":"...","tips":["tip1","tip2","tip3"]}`;

  const text = await callModel([{ role: 'user', content: prompt }], 3000);
  const q    = parseObject(text);
  return { q: q.q, a: q.a, tips: q.tips || [], reviewed: false, note: '' };
}

// ── Comparison ────────────────────────────────────────────────────────────────
export async function generateComparison(topicA, topicB) {
  const prompt =
`You are a senior software engineering educator comparing "${topicA}" and "${topicB}" for an engineer with 8 years of experience.

Return ONLY a raw JSON object — no markdown, no backticks.

Schema:
{
  "summary": "2-3 sentence overview of both and when you'd use each",
  "shared_concepts": [
    {
      "concept": "concept name",
      "topic_a": { "explanation": "how ${topicA} handles this", "code": "working code example" },
      "topic_b": { "explanation": "how ${topicB} handles this", "code": "working code example" },
      "difference": "key difference or gotcha"
    }
  ],
  "only_in_a": ["unique feature/concept in ${topicA}"],
  "only_in_b": ["unique feature/concept in ${topicB}"],
  "when_to_use_a": "paragraph on when to choose ${topicA}",
  "when_to_use_b": "paragraph on when to choose ${topicB}"
}

Requirements:
- 8-10 shared_concepts covering the most interview-relevant concepts
- Real, runnable code examples showing the same operation in both
- 4-6 items each in only_in_a and only_in_b
- Technical depth for experienced engineers`;

  const text = await callModel([{ role: 'user', content: prompt }], 10000);
  return parseObject(text);
}

// ── JD Analysis + Questions ───────────────────────────────────────────────────
export async function analyzeJD(jdText) {
  const prompt =
`Extract structured information from this job description for interview preparation.

Job Description:
${jdText}

Return ONLY a raw JSON object:
{
  "title": "job title",
  "company": "company name or 'Not specified'",
  "level": "Junior/Mid/Senior/Staff/Principal",
  "tech_stack": ["technology", "framework", "tool"],
  "key_responsibilities": ["3-5 core responsibilities"],
  "focus_areas": ["3-5 specific technical areas to prep for, derived from JD"],
  "soft_skills": ["communication", "leadership" etc if mentioned]
}`;

  const text = await callModel([{ role: 'user', content: prompt }], 2000);
  return parseObject(text);
}

export async function generateJDQuestions(analysis, jdText) {
  const stack  = (analysis.tech_stack || []).join(', ');
  const focus  = (analysis.focus_areas || []).join(', ');
  const resp   = (analysis.key_responsibilities || []).join('; ');

  const prompt =
`You are a senior engineering interviewer preparing someone for a specific job interview.

Role: ${analysis.title} at ${analysis.company} (${analysis.level})
Tech stack: ${stack}
Focus areas: ${focus}
Key responsibilities: ${resp}

Generate 15 targeted interview questions specifically for THIS role — not generic questions.
Each question must reference specific technologies, responsibilities, or scenarios from the job description.

Return ONLY a raw JSON array. No markdown. Start with [ end with ]

Each item:
{
  "q": "specific, role-targeted question",
  "a": "detailed answer tailored to this role — use the company context, mention the specific tech stack",
  "tips": ["specific tip for this question in context of this role", "what this company likely cares about", "follow-up they may ask"]
}`;

  const text = await callModel([{ role: 'user', content: prompt }], 12000);
  const qs   = parseArray(text);
  return qs.map(q => ({ q: q.q, a: q.a, tips: q.tips || [], reviewed: false, note: '' }));
}

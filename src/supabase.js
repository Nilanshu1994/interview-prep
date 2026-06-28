import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL  || '';
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
export const supabase = createClient(url, key);

// ── Topics + Questions ─────────────────────────────────────────────────────────
// All questions stored with difficulty='all' — single flat list per topic

export async function loadAll() {
  const { data: topics, error: te } = await supabase
    .from('topics').select('id, name').order('created_at', { ascending: true });
  if (te) throw te;
  if (!topics?.length) return {};

  const { data: questions, error: qe } = await supabase
    .from('questions').select('*')
    .in('topic_id', topics.map(t => t.id))
    .order('position', { ascending: true });
  if (qe) throw qe;

  const db = {};
  for (const topic of topics) {
    db[topic.name] = {
      _id: topic.id,
      questions: [],
      idx: 0,
    };
    for (const q of (questions || []).filter(q => q.topic_id === topic.id)) {
      db[topic.name].questions.push({
        _id: q.id, q: q.q, a: q.a,
        tips: q.tips || [],
        reviewed: q.reviewed, note: q.note || '',
      });
    }
  }
  return db;
}

export async function dbAddTopic(name) {
  const { data, error } = await supabase
    .from('topics').insert({ name }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function dbDeleteTopic(topicId) {
  const { error } = await supabase.from('topics').delete().eq('id', topicId);
  if (error) throw error;
}

// Appends new questions to existing ones (never replaces all)
export async function dbAppendQuestions(topicId, questions, startPosition) {
  if (!questions.length) return [];
  const rows = questions.map((q, i) => ({
    topic_id: topicId,
    difficulty: 'all',
    q: q.q, a: q.a, tips: q.tips || [],
    reviewed: q.reviewed || false, note: q.note || '',
    position: startPosition + i,
  }));
  const { data, error } = await supabase.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.map(r => r.id);
}

// Replace a full batch (used only for initial load or full reset)
export async function dbSetQuestions(topicId, questions) {
  await supabase.from('questions').delete()
    .eq('topic_id', topicId).eq('difficulty', 'all');
  if (!questions.length) return [];
  const rows = questions.map((q, i) => ({
    topic_id: topicId, difficulty: 'all',
    q: q.q, a: q.a, tips: q.tips || [],
    reviewed: q.reviewed || false, note: q.note || '', position: i,
  }));
  const { data, error } = await supabase.from('questions').insert(rows).select('id');
  if (error) throw error;
  return data.map(r => r.id);
}

export async function dbUpdateQuestion(questionId, patch) {
  const { error } = await supabase.from('questions').update(patch).eq('id', questionId);
  if (error) throw error;
}

export async function dbReplaceQuestion(questionId, q, a, tips) {
  const { error } = await supabase.from('questions')
    .update({ q, a, tips: tips || [], reviewed: false, note: '' }).eq('id', questionId);
  if (error) throw error;
}

// ── Comparisons ───────────────────────────────────────────────────────────────
export async function loadComparisons() {
  const { data, error } = await supabase
    .from('comparisons').select('topic_a, topic_b, data').order('created_at', { ascending: true });
  if (error) throw error;
  const map = {};
  for (const row of (data || [])) map[compKey(row.topic_a, row.topic_b)] = row.data;
  return map;
}

export async function dbSaveComparison(topicA, topicB, data) {
  const { error } = await supabase.from('comparisons')
    .upsert({ topic_a: topicA, topic_b: topicB, data }, { onConflict: 'topic_a,topic_b' });
  if (error) throw error;
}

export async function dbDeleteComparison(topicA, topicB) {
  const { error } = await supabase.from('comparisons')
    .delete().eq('topic_a', topicA).eq('topic_b', topicB);
  if (error) throw error;
}

export function compKey(a, b) { return [a, b].sort().join('|||'); }

// ── JD Sessions ───────────────────────────────────────────────────────────────
export async function loadJDSessions() {
  const { data, error } = await supabase
    .from('jd_sessions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function dbSaveJDSession(session) {
  const { data, error } = await supabase
    .from('jd_sessions').insert(session).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function dbUpdateJDSession(id, patch) {
  const { error } = await supabase.from('jd_sessions').update(patch).eq('id', id);
  if (error) throw error;
}

export async function dbDeleteJDSession(id) {
  const { error } = await supabase.from('jd_sessions').delete().eq('id', id);
  if (error) throw error;
}

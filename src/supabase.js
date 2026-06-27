import { createClient } from '@supabase/supabase-js';

const url  = process.env.REACT_APP_SUPABASE_URL  || '';
const key  = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(url, key);

// ─── TABLE LAYOUT ───────────────────────────────────────────────────────────
//
//  topics
//  ┌─────────────┬──────────┬────────────────────────────────────────────┐
//  │ id (uuid)   │ name     │ created_at                                 │
//  └─────────────┴──────────┴────────────────────────────────────────────┘
//
//  questions
//  ┌──────────┬──────────┬────────────┬──────────┬──────────┬──────────┐
//  │ id(uuid) │ topic_id │ difficulty │ q (text) │ a (text) │ position │
//  │ reviewed │ note     │ created_at │          │          │          │
//  └──────────┴──────────┴────────────┴──────────┴──────────┴──────────┘
//
// ────────────────────────────────────────────────────────────────────────────

// Load all topics and their questions, return in the db shape the app expects:
// { [topicName]: { easy:{questions:[],idx:0}, medium:{...}, hard:{...} } }
export async function loadAll() {
  const { data: topics, error: te } = await supabase
    .from('topics')
    .select('id, name')
    .order('created_at', { ascending: true });

  if (te) throw te;
  if (!topics?.length) return {};

  const { data: questions, error: qe } = await supabase
    .from('questions')
    .select('*')
    .in('topic_id', topics.map(t => t.id))
    .order('position', { ascending: true });

  if (qe) throw qe;

  const db = {};
  for (const topic of topics) {
    db[topic.name] = {
      _id: topic.id,
      easy:   { questions: [], idx: 0 },
      medium: { questions: [], idx: 0 },
      hard:   { questions: [], idx: 0 },
    };
    const qs = (questions || []).filter(q => q.topic_id === topic.id);
    for (const q of qs) {
      const diff = q.difficulty;
      if (db[topic.name][diff]) {
        db[topic.name][diff].questions.push({
          _id: q.id,
          q: q.q,
          a: q.a,
          reviewed: q.reviewed,
          note: q.note || '',
        });
      }
    }
  }
  return db;
}

// Add a topic row, return its uuid
export async function dbAddTopic(name) {
  const { data, error } = await supabase
    .from('topics')
    .insert({ name })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// Delete a topic and all its questions (cascade handled by FK in Supabase)
export async function dbDeleteTopic(topicId) {
  const { error } = await supabase.from('topics').delete().eq('id', topicId);
  if (error) throw error;
}

// Insert a batch of questions for a topic+difficulty
export async function dbSaveQuestions(topicId, difficulty, questions) {
  // Delete old ones for this topic+difficulty first
  await supabase.from('questions')
    .delete()
    .eq('topic_id', topicId)
    .eq('difficulty', difficulty);

  if (!questions.length) return [];

  const rows = questions.map((q, i) => ({
    topic_id: topicId,
    difficulty,
    q: q.q,
    a: q.a,
    reviewed: q.reviewed || false,
    note: q.note || '',
    position: i,
  }));

  const { data, error } = await supabase
    .from('questions')
    .insert(rows)
    .select('id');
  if (error) throw error;
  return data.map(r => r.id);
}

// Update a single question's reviewed + note fields
export async function dbUpdateQuestion(questionId, patch) {
  const { error } = await supabase
    .from('questions')
    .update(patch)
    .eq('id', questionId);
  if (error) throw error;
}

// Replace a single question (regenerate)
export async function dbReplaceQuestion(questionId, q, a) {
  const { error } = await supabase
    .from('questions')
    .update({ q, a, reviewed: false, note: '' })
    .eq('id', questionId);
  if (error) throw error;
}

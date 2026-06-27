import { useState, useEffect, useCallback } from 'react';
import {
  loadAll,
  dbAddTopic, dbDeleteTopic,
  dbSaveQuestions, dbUpdateQuestion, dbReplaceQuestion,
} from './supabase';

export function useStore() {
  const [db, setDb]           = useState({});           // in-memory working copy
  const [theme, setTheme]     = useState(() => localStorage.getItem('prep_theme') || 'light');
  const [syncStatus, setSyncStatus] = useState('loading'); // loading | ready | saving | error
  const [syncError, setSyncError]   = useState('');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prep_theme', theme);
  }, [theme]);

  // Boot: load everything from Supabase
  useEffect(() => {
    loadAll()
      .then(data => { setDb(data); setSyncStatus('ready'); })
      .catch(e  => { setSyncStatus('error'); setSyncError(e.message || 'Failed to connect to database'); });
  }, []);

  // ── TOPICS ──────────────────────────────────────────────────────────────────

  const addTopic = useCallback(async (name) => {
    setSyncStatus('saving');
    try {
      const id = await dbAddTopic(name);
      setDb(prev => ({
        ...prev,
        [name]: {
          _id: id,
          easy:   { questions: [], idx: 0 },
          medium: { questions: [], idx: 0 },
          hard:   { questions: [], idx: 0 },
        },
      }));
      setSyncStatus('ready');
      return id;
    } catch(e) { setSyncStatus('error'); setSyncError(e.message); throw e; }
  }, []);

  const deleteTopic = useCallback(async (name) => {
    const topicId = db[name]?._id;
    if (!topicId) return;
    setSyncStatus('saving');
    try {
      await dbDeleteTopic(topicId);
      setDb(prev => { const n = {...prev}; delete n[name]; return n; });
      setSyncStatus('ready');
    } catch(e) { setSyncStatus('error'); setSyncError(e.message); throw e; }
  }, [db]);

  // ── QUESTIONS ────────────────────────────────────────────────────────────────

  const setQuestions = useCallback(async (topicName, diff, questions) => {
    const topicId = db[topicName]?._id;
    if (!topicId) return;
    setSyncStatus('saving');
    try {
      const ids = await dbSaveQuestions(topicId, diff, questions);
      const withIds = questions.map((q, i) => ({ ...q, _id: ids[i] }));
      setDb(prev => ({
        ...prev,
        [topicName]: {
          ...prev[topicName],
          [diff]: { questions: withIds, idx: 0 },
        },
      }));
      setSyncStatus('ready');
    } catch(e) { setSyncStatus('error'); setSyncError(e.message); throw e; }
  }, [db]);

  const setIdx = useCallback((topicName, diff, idx) => {
    // idx is local-only (no need to persist to DB)
    setDb(prev => ({
      ...prev,
      [topicName]: {
        ...prev[topicName],
        [diff]: { ...prev[topicName]?.[diff], idx },
      },
    }));
  }, []);

  const toggleReviewed = useCallback(async (topicName, diff, idx) => {
    const q = db[topicName]?.[diff]?.questions?.[idx];
    if (!q) return;
    const newVal = !q.reviewed;
    // Optimistic update
    setDb(prev => {
      const qs = [...prev[topicName][diff].questions];
      qs[idx] = { ...qs[idx], reviewed: newVal };
      return { ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName][diff], questions: qs } } };
    });
    if (q._id) await dbUpdateQuestion(q._id, { reviewed: newVal }).catch(() => {});
  }, [db]);

  const saveNote = useCallback(async (topicName, diff, idx, note) => {
    const q = db[topicName]?.[diff]?.questions?.[idx];
    if (!q) return;
    // Optimistic update
    setDb(prev => {
      const qs = [...prev[topicName][diff].questions];
      qs[idx] = { ...qs[idx], note };
      return { ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName][diff], questions: qs } } };
    });
    if (q._id) await dbUpdateQuestion(q._id, { note }).catch(() => {});
  }, [db]);

  const replaceQuestion = useCallback(async (topicName, diff, idx, newQ) => {
    const q = db[topicName]?.[diff]?.questions?.[idx];
    if (!q) return;
    setDb(prev => {
      const qs = [...prev[topicName][diff].questions];
      qs[idx] = { ...qs[idx], ...newQ, _id: q._id };
      return { ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName][diff], questions: qs } } };
    });
    if (q._id) await dbReplaceQuestion(q._id, newQ.q, newQ.a).catch(() => {});
  }, [db]);

  // ── STATS ────────────────────────────────────────────────────────────────────

  const getTopicStats = useCallback((topicName) => {
    const data = db[topicName] || {};
    let total = 0, reviewed = 0;
    ['easy','medium','hard'].forEach(d => {
      total    += data[d]?.questions?.length || 0;
      reviewed += data[d]?.questions?.filter(q => q.reviewed).length || 0;
    });
    return { total, reviewed };
  }, [db]);

  return {
    db, theme, setTheme, syncStatus, syncError,
    addTopic, deleteTopic,
    setQuestions, setIdx,
    toggleReviewed, saveNote, replaceQuestion,
    getTopicStats,
  };
}

import { useState, useEffect, useCallback } from 'react';
import {
  loadAll, dbAddTopic, dbDeleteTopic,
  dbSaveQuestions, dbUpdateQuestion, dbReplaceQuestion,
  loadComparisons, dbSaveComparison, dbDeleteComparison, compKey,
  loadJDSessions, dbSaveJDSession, dbUpdateJDSession, dbDeleteJDSession,
} from './supabase';
import { generateComparison, analyzeJD, generateJDQuestions } from './api';

export function useStore() {
  const [db,          setDb]         = useState({});
  const [comparisons, setComparisons]= useState({});
  const [jdSessions,  setJdSessions] = useState([]);
  const [theme,       setTheme]      = useState(() => localStorage.getItem('prep_theme') || 'light');
  const [syncStatus,  setSyncStatus] = useState('loading');
  const [syncError,   setSyncError]  = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prep_theme', theme);
  }, [theme]);

  useEffect(() => {
    Promise.all([loadAll(), loadComparisons(), loadJDSessions()])
      .then(([topics, comps, jds]) => {
        setDb(topics); setComparisons(comps); setJdSessions(jds);
        setSyncStatus('ready');
      })
      .catch(e => { setSyncStatus('error'); setSyncError(e.message || 'DB connection failed'); });
  }, []);

  // ── Topics ────────────────────────────────────────────────────────────────────
  const addTopic = useCallback(async (name) => {
    setSyncStatus('saving');
    try {
      const id = await dbAddTopic(name);
      setDb(prev => ({
        ...prev,
        [name]: { _id:id, easy:{questions:[],idx:0}, medium:{questions:[],idx:0}, hard:{questions:[],idx:0} },
      }));
      setSyncStatus('ready'); return id;
    } catch(e) { setSyncStatus('error'); setSyncError(e.message); throw e; }
  }, []);

  const deleteTopic = useCallback(async (name) => {
    const id = db[name]?._id; if (!id) return;
    setSyncStatus('saving');
    try {
      await dbDeleteTopic(id);
      setDb(prev => { const n={...prev}; delete n[name]; return n; });
      setSyncStatus('ready');
    } catch(e) { setSyncStatus('error'); setSyncError(e.message); throw e; }
  }, [db]);

  // ── Questions ─────────────────────────────────────────────────────────────────
  const setQuestions = useCallback(async (topicName, diff, questions) => {
    const id = db[topicName]?._id; if (!id) return;
    setSyncStatus('saving');
    try {
      const ids     = await dbSaveQuestions(id, diff, questions);
      const withIds = questions.map((q, i) => ({ ...q, _id: ids[i] }));
      setDb(prev => ({ ...prev, [topicName]: { ...prev[topicName], [diff]: { questions: withIds, idx: 0 } } }));
      setSyncStatus('ready');
    } catch(e) { setSyncStatus('error'); setSyncError(e.message); throw e; }
  }, [db]);

  const setIdx = useCallback((topicName, diff, idx) => {
    setDb(prev => ({ ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName]?.[diff], idx } } }));
  }, []);

  const toggleReviewed = useCallback(async (topicName, diff, idx) => {
    const q = db[topicName]?.[diff]?.questions?.[idx]; if (!q) return;
    const val = !q.reviewed;
    setDb(prev => {
      const qs = [...prev[topicName][diff].questions];
      qs[idx] = { ...qs[idx], reviewed: val };
      return { ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName][diff], questions: qs } } };
    });
    if (q._id) dbUpdateQuestion(q._id, { reviewed: val }).catch(() => {});
  }, [db]);

  const saveNote = useCallback(async (topicName, diff, idx, note) => {
    const q = db[topicName]?.[diff]?.questions?.[idx]; if (!q) return;
    setDb(prev => {
      const qs = [...prev[topicName][diff].questions];
      qs[idx] = { ...qs[idx], note };
      return { ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName][diff], questions: qs } } };
    });
    if (q._id) dbUpdateQuestion(q._id, { note }).catch(() => {});
  }, [db]);

  const replaceQuestion = useCallback(async (topicName, diff, idx, newQ) => {
    const q = db[topicName]?.[diff]?.questions?.[idx]; if (!q) return;
    setDb(prev => {
      const qs = [...prev[topicName][diff].questions];
      qs[idx] = { ...qs[idx], ...newQ, _id: q._id };
      return { ...prev, [topicName]: { ...prev[topicName], [diff]: { ...prev[topicName][diff], questions: qs } } };
    });
    if (q._id) dbReplaceQuestion(q._id, newQ.q, newQ.a, newQ.tips).catch(() => {});
  }, [db]);

  const getTopicStats = useCallback((topicName) => {
    const data = db[topicName] || {};
    let total=0, reviewed=0;
    ['easy','medium','hard'].forEach(d => {
      total    += data[d]?.questions?.length || 0;
      reviewed += data[d]?.questions?.filter(q=>q.reviewed).length || 0;
    });
    return { total, reviewed };
  }, [db]);

  // ── Comparisons ───────────────────────────────────────────────────────────────
  const runComparison = useCallback(async (topicA, topicB) => {
    const key  = compKey(topicA, topicB);
    const data = await generateComparison(topicA, topicB);
    setComparisons(prev => ({ ...prev, [key]: data }));
    dbSaveComparison(topicA, topicB, data).catch(() => {});
    return data;
  }, []);

  const deleteComparison = useCallback(async (topicA, topicB) => {
    const key = compKey(topicA, topicB);
    setComparisons(prev => { const n={...prev}; delete n[key]; return n; });
    dbDeleteComparison(topicA, topicB).catch(() => {});
  }, []);

  const getComparison = useCallback((topicA, topicB) =>
    comparisons[compKey(topicA, topicB)] || null, [comparisons]);

  // ── JD Sessions ───────────────────────────────────────────────────────────────
  const createJDSession = useCallback(async (jdText) => {
    const analysis  = await analyzeJD(jdText);
    const questions = await generateJDQuestions(analysis, jdText);
    const title     = `${analysis.title} @ ${analysis.company}`;
    const session   = { title, jd_text: jdText, analysis, questions };
    const id        = await dbSaveJDSession(session);
    const full      = { id, ...session, created_at: new Date().toISOString() };
    setJdSessions(prev => [full, ...prev]);
    return full;
  }, []);

  const deleteJDSession = useCallback(async (id) => {
    await dbDeleteJDSession(id);
    setJdSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateJDQuestion = useCallback(async (sessionId, idx, patch) => {
    setJdSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const qs = [...s.questions];
      qs[idx] = { ...qs[idx], ...patch };
      return { ...s, questions: qs };
    }));
    const session = jdSessions.find(s => s.id === sessionId);
    if (session) {
      const qs = [...session.questions];
      qs[idx] = { ...qs[idx], ...patch };
      dbUpdateJDSession(sessionId, { questions: qs }).catch(() => {});
    }
  }, [jdSessions]);

  return {
    db, theme, setTheme, syncStatus, syncError,
    addTopic, deleteTopic,
    setQuestions, setIdx, toggleReviewed, saveNote, replaceQuestion, getTopicStats,
    comparisons, runComparison, deleteComparison, getComparison,
    jdSessions, createJDSession, deleteJDSession, updateJDQuestion,
  };
}

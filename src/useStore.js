import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'prep_db_v2';

function loadDb() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveDb(db) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* storage full */ }
}

export function useStore() {
  const [db, setDb] = useState(loadDb);
  const [theme, setTheme] = useState(() => localStorage.getItem('prep_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prep_theme', theme);
  }, [theme]);

  const updateDb = useCallback((updater) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDb(next);
      return next;
    });
  }, []);

  const addTopic = useCallback((name) => {
    updateDb((prev) => ({
      ...prev,
      [name]: {
        easy: { questions: [], idx: 0 },
        medium: { questions: [], idx: 0 },
        hard: { questions: [], idx: 0 },
      },
    }));
  }, [updateDb]);

  const deleteTopic = useCallback((name) => {
    updateDb((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, [updateDb]);

  const setQuestions = useCallback((topic, diff, questions) => {
    updateDb((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [diff]: { questions, idx: 0 },
      },
    }));
  }, [updateDb]);

  const setQuestion = useCallback((topic, diff, idx, question) => {
    updateDb((prev) => {
      const qs = [...(prev[topic]?.[diff]?.questions || [])];
      qs[idx] = question;
      return {
        ...prev,
        [topic]: {
          ...prev[topic],
          [diff]: { ...prev[topic][diff], questions: qs },
        },
      };
    });
  }, [updateDb]);

  const setIdx = useCallback((topic, diff, idx) => {
    updateDb((prev) => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [diff]: { ...prev[topic]?.[diff], idx },
      },
    }));
  }, [updateDb]);

  const toggleReviewed = useCallback((topic, diff, idx) => {
    updateDb((prev) => {
      const qs = [...(prev[topic]?.[diff]?.questions || [])];
      qs[idx] = { ...qs[idx], reviewed: !qs[idx].reviewed };
      return {
        ...prev,
        [topic]: {
          ...prev[topic],
          [diff]: { ...prev[topic][diff], questions: qs },
        },
      };
    });
  }, [updateDb]);

  const saveNote = useCallback((topic, diff, idx, note) => {
    updateDb((prev) => {
      const qs = [...(prev[topic]?.[diff]?.questions || [])];
      qs[idx] = { ...qs[idx], note };
      return {
        ...prev,
        [topic]: {
          ...prev[topic],
          [diff]: { ...prev[topic][diff], questions: qs },
        },
      };
    });
  }, [updateDb]);

  const getTopicStats = useCallback((topicName) => {
    const data = db[topicName] || {};
    let total = 0, reviewed = 0;
    Object.values(data).forEach((d) => {
      total += d.questions?.length || 0;
      reviewed += d.questions?.filter((q) => q.reviewed).length || 0;
    });
    return { total, reviewed };
  }, [db]);

  return {
    db, theme, setTheme,
    addTopic, deleteTopic,
    setQuestions, setQuestion, setIdx,
    toggleReviewed, saveNote,
    getTopicStats,
  };
}

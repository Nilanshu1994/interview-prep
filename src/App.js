import React, { useState } from 'react';
import './index.css';
import { useStore } from './useStore';
import Sidebar from './components/Sidebar';
import QuestionView from './components/QuestionView';
import TokenModal from './components/TokenModal';

export default function App() {
  const {
    db, theme, setTheme,
    addTopic, deleteTopic,
    setQuestions, setQuestion, setIdx,
    toggleReviewed, saveNote,
    getTopicStats,
  } = useStore();

  const [activeTopic, setActiveTopic] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(!localStorage.getItem('gh_token'));

  function handleSelectTopic(name) {
    setActiveTopic(name);
  }

  function handleAddTopic(name) {
    addTopic(name);
    setActiveTopic(name);
  }

  function handleDeleteTopic(name) {
    if (!window.confirm(`Delete "${name}"? All Q&As and notes will be lost.`)) return;
    deleteTopic(name);
    if (activeTopic === name) setActiveTopic(null);
  }

  function handleTokenError() {
    setShowTokenModal(true);
  }

  return (
    <>
      {showTokenModal && (
        <TokenModal onSave={() => setShowTokenModal(false)} />
      )}

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          db={db}
          activeTopic={activeTopic}
          onSelect={handleSelectTopic}
          onAdd={handleAddTopic}
          onDelete={handleDeleteTopic}
          onChangeToken={() => setShowTokenModal(true)}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          getTopicStats={getTopicStats}
        />

        <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
          {activeTopic && db[activeTopic] ? (
            <QuestionView
              topicName={activeTopic}
              topicData={db[activeTopic]}
              setQuestions={setQuestions}
              setQuestion={setQuestion}
              setIdx={setIdx}
              toggleReviewed={toggleReviewed}
              saveNote={saveNote}
              onTokenError={handleTokenError}
            />
          ) : (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem',
            }}>
              <div style={{ fontSize: '52px', opacity: 0.25 }}>📖</div>
              <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Pick a topic to study
              </h2>
              <p style={{ fontSize: '14px', maxWidth: '300px', lineHeight: '1.6' }}>
                Add a topic from the sidebar — like "Django ORM", "Kubernetes", "PostgreSQL", or "System Design"
                — and get 10 AI-generated interview questions instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

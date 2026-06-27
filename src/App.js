import React, { useState } from 'react';
import './index.css';
import { useStore }      from './useStore';
import Sidebar           from './components/Sidebar';
import QuestionView      from './components/QuestionView';
import CompareView       from './components/CompareView';

const SYNC_UI = {
  loading: { color: 'var(--accent-text)', bg: 'var(--accent-bg)',  label: '⟳ Connecting…'       },
  saving:  { color: 'var(--warning)',     bg: 'var(--warning-bg)', label: '↑ Saving…'             },
  error:   { color: 'var(--danger)',      bg: 'var(--danger-bg)',  label: '✕ Database error'      },
  ready:   { color: 'var(--success)',     bg: 'transparent',       label: '✓ Synced'              },
};

// Tab button in the main area top-right
function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-bg)' : 'none',
      color: active ? 'var(--accent-text)' : 'var(--text-muted)',
      cursor: 'pointer', transition: 'all 0.12s',
    }}>{label}</button>
  );
}

export default function App() {
  const {
    db, theme, setTheme, syncStatus, syncError,
    addTopic, deleteTopic,
    setQuestions, setIdx,
    toggleReviewed, saveNote, replaceQuestion,
    getTopicStats,
    runComparison, deleteComparison, getComparison,
  } = useStore();

  const [activeTopic, setActiveTopic] = useState(null);
  const [mainTab,     setMainTab]     = useState('study'); // 'study' | 'compare'
  const sync = SYNC_UI[syncStatus] || SYNC_UI.ready;

  async function handleAddTopic(name) {
    await addTopic(name);
    setActiveTopic(name);
    setMainTab('study');
  }

  async function handleDeleteTopic(name) {
    if (!window.confirm(`Delete "${name}"? This permanently removes all its Q&As and notes.`)) return;
    await deleteTopic(name);
    if (activeTopic === name) setActiveTopic(null);
  }

  const showBanner = syncStatus === 'loading' || syncStatus === 'error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Sync banner */}
      {showBanner && (
        <div style={{
          padding: '7px 16px', fontSize: '12.5px', textAlign: 'center',
          background: sync.bg, color: sync.color,
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          {sync.label}{syncStatus === 'error' && syncError ? ` — ${syncError}` : ''}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <Sidebar
          db={db}
          activeTopic={mainTab === 'study' ? activeTopic : null}
          onSelect={name => { setActiveTopic(name); setMainTab('study'); }}
          onAdd={handleAddTopic}
          onDelete={handleDeleteTopic}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          getTopicStats={getTopicStats}
          syncStatus={syncStatus}
          syncLabel={sync.label}
          syncColor={sync.color}
        />

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

          {/* Tab bar — shown always */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: 'var(--surface)',
            borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <TabBtn label="📖 Study"   active={mainTab === 'study'}   onClick={() => setMainTab('study')} />
            <TabBtn label="⚖ Compare" active={mainTab === 'compare'} onClick={() => setMainTab('compare')} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>

            {/* STUDY TAB */}
            {mainTab === 'study' && (
              syncStatus === 'loading' ? (
                <div style={{
                  height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: '12px', color: 'var(--text-muted)',
                }}>
                  <div style={{
                    width: '28px', height: '28px',
                    border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: '14px' }}>Loading your topics…</span>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : activeTopic && db[activeTopic] ? (
                <QuestionView
                  topicName={activeTopic}
                  topicData={db[activeTopic]}
                  setQuestions={setQuestions}
                  setIdx={setIdx}
                  toggleReviewed={toggleReviewed}
                  saveNote={saveNote}
                  replaceQuestion={replaceQuestion}
                />
              ) : (
                <div style={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '12px', textAlign: 'center', padding: '2rem',
                }}>
                  <div style={{ fontSize: '52px', opacity: 0.18 }}>📖</div>
                  <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Pick a topic to study
                  </h2>
                  <p style={{ fontSize: '14px', maxWidth: '300px', lineHeight: '1.65', color: 'var(--text-muted)' }}>
                    Select a topic from the sidebar or add a new one.
                    Switch to <strong>Compare</strong> to see two topics side by side.
                  </p>
                </div>
              )
            )}

            {/* COMPARE TAB */}
            {mainTab === 'compare' && (
              <CompareView
                topics={db}
                getComparison={getComparison}
                runComparison={runComparison}
                deleteComparison={deleteComparison}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

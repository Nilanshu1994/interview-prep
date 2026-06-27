import React, { useState } from 'react';
import './index.css';
import { useStore } from './useStore';
import Sidebar from './components/Sidebar';
import QuestionView from './components/QuestionView';

const SYNC_UI = {
  loading: { color: 'var(--accent-text)',  bg: 'var(--accent-bg)',  label: '⟳ Connecting to database…' },
  saving:  { color: 'var(--warning)',      bg: 'var(--warning-bg)', label: '↑ Saving…' },
  error:   { color: 'var(--danger)',       bg: 'var(--danger-bg)',  label: '✕ Database error' },
  ready:   { color: 'var(--success)',      bg: 'transparent',       label: '✓ Synced' },
};

export default function App() {
  const {
    db, theme, setTheme, syncStatus, syncError,
    addTopic, deleteTopic,
    setQuestions, setIdx,
    toggleReviewed, saveNote, replaceQuestion,
    getTopicStats,
  } = useStore();

  const [activeTopic, setActiveTopic] = useState(null);
  const sync = SYNC_UI[syncStatus] || SYNC_UI.ready;

  async function handleAddTopic(name) {
    await addTopic(name);
    setActiveTopic(name);
  }

  async function handleDeleteTopic(name) {
    if (!window.confirm(`Delete "${name}"? This will permanently remove all its Q&As and notes.`)) return;
    await deleteTopic(name);
    if (activeTopic === name) setActiveTopic(null);
  }

  const showBanner = syncStatus === 'loading' || syncStatus === 'error';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

      {/* Top banner — only while loading or on error */}
      {showBanner && (
        <div style={{
          padding: '7px 16px', fontSize: '12.5px', textAlign: 'center',
          background: sync.bg, color: sync.color,
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          {sync.label}{syncStatus === 'error' && syncError ? ` — ${syncError}` : ''}
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar
          db={db}
          activeTopic={activeTopic}
          onSelect={setActiveTopic}
          onAdd={handleAddTopic}
          onDelete={handleDeleteTopic}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          getTopicStats={getTopicStats}
          syncStatus={syncStatus}
          syncLabel={sync.label}
          syncColor={sync.color}
        />

        <div style={{ flex:1, overflow:'hidden', background:'var(--bg)' }}>
          {syncStatus === 'loading' ? (
            <div style={{
              height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:'12px', color:'var(--text-muted)',
            }}>
              <div style={{
                width:'28px', height:'28px',
                border:'3px solid var(--border-strong)', borderTopColor:'var(--accent)',
                borderRadius:'50%', animation:'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize:'14px' }}>Loading your topics…</span>
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
              height:'100%', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              gap:'12px', textAlign:'center', padding:'2rem',
            }}>
              <div style={{ fontSize:'52px', opacity:0.18 }}>📖</div>
              <h2 style={{ fontSize:'18px', fontWeight:500, color:'var(--text-secondary)' }}>
                Pick a topic to study
              </h2>
              <p style={{ fontSize:'14px', maxWidth:'300px', lineHeight:'1.65', color:'var(--text-muted)' }}>
                Add a topic from the sidebar — "Django ORM", "System Design", "Kubernetes", "PostgreSQL" —
                and get 10 AI-generated interview questions instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

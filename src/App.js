import React, { useState, useEffect } from 'react';
import './index.css';
import { useStore }      from './useStore';
import Sidebar           from './components/Sidebar';
import QuestionView      from './components/QuestionView';
import CompareView       from './components/CompareView';
import JDView            from './components/JDView';

const SYNC_UI = {
  loading: { color:'var(--accent-txt)', bg:'var(--accent-2)', label:'⟳ Connecting…'  },
  saving:  { color:'var(--amber)',      bg:'var(--amber-2)',  label:'↑ Saving…'        },
  error:   { color:'var(--red)',        bg:'var(--red-2)',    label:'✕ Database error' },
  ready:   { color:'var(--green)',      bg:'transparent',     label:'✓ Synced'         },
};

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button className={`bottom-nav-btn${active ? ' active' : ''}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      {label}
    </button>
  );
}

function EmptyStudy({ isMobile, onOpenTopics }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, textAlign:'center', padding:32 }}>
      <div style={{ fontSize:56, opacity:0.12 }}>📖</div>
      <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)' }}>Pick a topic</h2>
      <p style={{ fontSize:14, maxWidth:280, lineHeight:1.7, color:'var(--text-3)' }}>
        {isMobile ? 'Tap Topics below to get started.' : 'Select a topic from the sidebar or add a new one.'}
      </p>
      {isMobile && (
        <button className="btn btn-primary" style={{ marginTop:4 }} onClick={onOpenTopics}>Browse Topics →</button>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, color:'var(--text-3)' }}>
      <div className="spinner spinner-lg" />
      <span style={{ fontSize:14 }}>Loading your topics…</span>
    </div>
  );
}

export default function App() {
  const {
    db, theme, setTheme, syncStatus, syncError,
    addTopic, deleteTopic,
    setQuestions, appendQuestions, setIdx,
    toggleReviewed, saveNote, replaceQuestion, getTopicStats,
    runComparison, deleteComparison, getComparison,
    jdSessions, createJDSession, deleteJDSession, updateJDQuestion,
  } = useStore();

  const isMobile      = useIsMobile();
  const [tab,         setTab]        = useState('study');
  const [activeTopic, setActiveTopic]= useState(null);
  const [drawerOpen,  setDrawerOpen] = useState(false);
  const sync = SYNC_UI[syncStatus] || SYNC_UI.ready;
  const showBanner = syncStatus === 'loading' || syncStatus === 'error';

  useEffect(() => { if (!isMobile) setDrawerOpen(false); }, [isMobile]);

  function handleSelectTopic(name) { setActiveTopic(name); setTab('study'); setDrawerOpen(false); }

  async function handleAddTopic(name) {
    await addTopic(name); setActiveTopic(name); setTab('study'); setDrawerOpen(false);
  }

  async function handleDeleteTopic(name) {
    if (!window.confirm(`Delete "${name}"? All Q&As and notes will be permanently removed.`)) return;
    await deleteTopic(name);
    if (activeTopic === name) setActiveTopic(null);
  }

  const TABS = [
    { id:'study',   icon:'📖', label:'Study'   },
    { id:'compare', icon:'⚖',  label:'Compare' },
    { id:'jd',      icon:'📄', label:'JD Prep' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>

      {showBanner && (
        <div style={{ padding:'6px 16px', fontSize:12, textAlign:'center', flexShrink:0, background:sync.bg, color:sync.color, borderBottom:'1px solid var(--border)' }}>
          {sync.label}{syncStatus === 'error' && syncError ? ` — ${syncError}` : ''}
        </div>
      )}

      <div className="app-shell">
        <div className={`drawer-overlay${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />

        <Sidebar
          db={db}
          activeTopic={tab === 'study' ? activeTopic : null}
          onSelect={handleSelectTopic}
          onAdd={handleAddTopic}
          onDelete={handleDeleteTopic}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          getTopicStats={getTopicStats}
          syncStatus={syncStatus}
          syncLabel={sync.label}
          syncColor={sync.color}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="main-area">

          {/* Desktop tab bar */}
          {!isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:600,
                  border:`1px solid ${tab === t.id ? 'var(--accent-3)' : 'var(--border)'}`,
                  background: tab === t.id ? 'var(--accent-2)' : 'none',
                  color: tab === t.id ? 'var(--accent-txt)' : 'var(--text-3)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all 0.12s',
                }}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          )}

          {/* Mobile header */}
          {isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <button className="btn btn-icon btn-sm" onClick={() => setDrawerOpen(true)} style={{ fontSize:18 }}>☰</button>
              <div style={{ flex:1, fontSize:15, fontWeight:700, color:'var(--text)' }}>
                {tab === 'study' && (activeTopic || 'Interview Prep')}
                {tab === 'compare' && '⚖ Compare'}
                {tab === 'jd' && '📄 JD Prep'}
              </div>
              <button className="btn btn-icon btn-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            </div>
          )}

          <div style={{ flex:1, overflow:'hidden' }}>
            {tab === 'study' && (
              syncStatus === 'loading' ? <LoadingScreen /> :
              activeTopic && db[activeTopic] ? (
                <QuestionView
                  topicName={activeTopic}
                  topicData={db[activeTopic]}
                  setQuestions={setQuestions}
                  appendQuestions={appendQuestions}
                  setIdx={setIdx}
                  toggleReviewed={toggleReviewed}
                  saveNote={saveNote}
                  replaceQuestion={replaceQuestion}
                />
              ) : (
                <EmptyStudy isMobile={isMobile} onOpenTopics={() => setDrawerOpen(true)} />
              )
            )}

            {tab === 'compare' && (
              <CompareView topics={db} getComparison={getComparison} runComparison={runComparison} deleteComparison={deleteComparison} />
            )}

            {tab === 'jd' && (
              <JDView jdSessions={jdSessions} createJDSession={createJDSession} deleteJDSession={deleteJDSession} updateJDQuestion={updateJDQuestion} />
            )}
          </div>

          {isMobile && (
            <div className="bottom-nav">
              <div className="bottom-nav-inner">
                <NavBtn icon="📚" label="Topics"  active={drawerOpen}       onClick={() => setDrawerOpen(o => !o)} />
                <NavBtn icon="📖" label="Study"   active={tab === 'study'}  onClick={() => { setTab('study');   setDrawerOpen(false); }} />
                <NavBtn icon="⚖"  label="Compare" active={tab === 'compare'}onClick={() => { setTab('compare'); setDrawerOpen(false); }} />
                <NavBtn icon="📄" label="JD Prep" active={tab === 'jd'}     onClick={() => { setTab('jd');      setDrawerOpen(false); }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

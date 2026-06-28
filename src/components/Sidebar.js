import React, { useState, useEffect } from 'react';
import PinModal from './PinModal';

export default function Sidebar({
  db, activeTopic, onSelect, onAdd, onDelete,
  theme, onToggleTheme, getTopicStats,
  syncStatus, syncLabel, syncColor,
  isOpen, onClose,
}) {
  const [filter,     setFilter]     = useState('');
  const [newTopic,   setNewTopic]   = useState('');
  const [adding,     setAdding]     = useState(false);
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [showPin,    setShowPin]    = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem('admin_unlocked') === '1') setIsAdmin(true);
  }, []);

  const topics = Object.keys(db).filter(t => t.toLowerCase().includes(filter.toLowerCase()));

  async function handleAdd() {
    const name = newTopic.trim();
    if (!name) return;
    if (db[name]) { alert('Topic already exists.'); return; }
    setAdding(true);
    try { await onAdd(name); setNewTopic(''); onClose(); }
    finally { setAdding(false); }
  }

  function handleLockToggle() {
    if (isAdmin) { sessionStorage.removeItem('admin_unlocked'); setIsAdmin(false); }
    else setShowPin(true);
  }

  async function handleDelete(name) {
    if (delConfirm === name) {
      setDelConfirm(null); await onDelete(name);
    } else {
      setDelConfirm(name);
      setTimeout(() => setDelConfirm(c => c === name ? null : c), 3000);
    }
  }

  const topicCount = Object.keys(db).length;

  return (
    <>
      {showPin && <PinModal onSuccess={() => { setIsAdmin(true); setShowPin(false); }} onClose={() => setShowPin(false)} />}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Header */}
        <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          <div style={{ width:32, height:32, background:'var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📚</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1.2 }}>Interview Prep</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{topicCount} topic{topicCount!==1?'s':''}</div>
          </div>
          <button
            className="btn btn-icon"
            style={{ borderColor: isAdmin?'var(--green-3)':'var(--border)', color: isAdmin?'var(--green)':'var(--text-3)', background: isAdmin?'var(--green-2)':'none' }}
            onClick={handleLockToggle} title={isAdmin?'Lock admin':'Unlock admin'}
          >{isAdmin?'🔓':'🔒'}</button>
          <button className="btn btn-icon" onClick={onToggleTheme} title="Toggle theme">{theme==='dark'?'☀️':'🌙'}</button>
        </div>

        {/* Admin banner */}
        {isAdmin && (
          <div style={{ padding:'6px 14px', fontSize:11, fontWeight:600, background:'var(--green-2)', color:'var(--green)', borderBottom:'1px solid var(--green-3)', flexShrink:0 }}>
            🔓 Admin — add &amp; delete enabled
          </div>
        )}

        {/* Search */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', flexShrink:0, position:'relative' }}>
          <span style={{ position:'absolute', left:22, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--text-3)', pointerEvents:'none' }}>🔍</span>
          <input
            className="input" style={{ paddingLeft:32, minHeight:38, fontSize:13 }}
            placeholder="Search topics…"
            value={filter} onChange={e => setFilter(e.target.value)}
          />
        </div>

        {/* Topic list */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {topics.length === 0 ? (
            <div style={{ padding:'20px 12px', fontSize:13, color:'var(--text-3)', textAlign:'center', lineHeight:1.6 }}>
              {filter ? 'No topics match.' : isAdmin ? 'Add a topic below.' : 'No topics yet.'}
            </div>
          ) : topics.map(t => {
            const { total, reviewed } = getTopicStats(t);
            const isActive  = t === activeTopic;
            const isPending = delConfirm === t;
            const pct       = total ? Math.round(reviewed/total*100) : 0;
            return (
              <div
                key={t}
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'10px 10px',
                  borderRadius:8, cursor:'pointer', marginBottom:2,
                  background: isPending ? 'var(--red-2)' : isActive ? 'var(--accent-2)' : 'transparent',
                  border: isPending ? '1px solid var(--red-3)' : '1px solid transparent',
                  transition:'background 0.12s',
                }}
                onClick={() => { setDelConfirm(null); onSelect(t); onClose(); }}
              >
                {/* Progress ring stub — just a colored dot */}
                <div style={{
                  width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background: pct===100 ? 'var(--green)' : pct>0 ? 'var(--accent)' : 'var(--border-strong)',
                }} />
                <span style={{
                  flex:1, fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  color: isPending ? 'var(--red)' : isActive ? 'var(--accent-txt)' : 'var(--text)',
                }} title={t}>{t}</span>
                {total > 0 && !isPending && (
                  <span style={{ fontSize:10, color: isActive?'var(--accent-txt)':'var(--text-3)', flexShrink:0 }}>{reviewed}/{total}</span>
                )}
                {isPending && (
                  <span style={{ fontSize:10, color:'var(--red)', fontWeight:600, flexShrink:0 }}>tap again</span>
                )}
                {isAdmin && (
                  <button
                    className="btn btn-icon btn-sm"
                    style={{ padding:'4px 6px', minHeight:28, minWidth:28, color: isPending?'var(--red)':'var(--text-3)', borderColor: isPending?'var(--red-3)':'transparent' }}
                    onClick={e => { e.stopPropagation(); handleDelete(t); }}
                    title={isPending?'Confirm delete':'Delete'}
                  >{isPending ? '✓' : '🗑'}</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add topic — admin only */}
        {isAdmin && (
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:6, flexShrink:0 }}>
            <input
              className="input" style={{ flex:1, fontSize:13 }}
              placeholder="e.g. Django ORM…"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !adding && handleAdd()}
              disabled={adding}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding} style={{ flexShrink:0 }}>
              {adding ? '…' : '+ Add'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ fontSize:11, color: syncColor||'var(--text-3)' }}>{syncLabel||'✓ Synced'}</div>
          <div style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>Supabase · all devices</div>
        </div>
      </aside>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import PinModal from './PinModal';

const s = {
  sidebar: {
    width:'272px', minWidth:'272px', background:'var(--surface)',
    borderRight:'1px solid var(--border)', display:'flex',
    flexDirection:'column', overflow:'hidden', height:'100%',
  },
  header: {
    padding:'14px 16px', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', gap:'10px',
  },
  logo: {
    width:'32px', height:'32px', background:'var(--accent)',
    borderRadius:'8px', display:'flex', alignItems:'center',
    justifyContent:'center', fontSize:'16px', flexShrink:0,
  },
  title:  { fontSize:'14px', fontWeight:600, color:'var(--text)' },
  sub:    { fontSize:'11px', color:'var(--text-muted)', marginTop:'1px' },
  iconBtn:{
    background:'none', border:'1px solid var(--border)', borderRadius:'7px',
    padding:'5px 7px', cursor:'pointer', fontSize:'14px',
    color:'var(--text-secondary)', lineHeight:1, flexShrink:0,
  },
  searchWrap: { padding:'10px 12px', borderBottom:'1px solid var(--border)', position:'relative' },
  searchIcon: {
    position:'absolute', left:'22px', top:'50%', transform:'translateY(-50%)',
    fontSize:'12px', color:'var(--text-muted)', pointerEvents:'none',
  },
  searchInput: {
    width:'100%', padding:'7px 10px 7px 28px', border:'1px solid var(--border)',
    borderRadius:'7px', background:'var(--bg)', color:'var(--text)',
    fontSize:'13px', outline:'none',
  },
  list:  { flex:1, overflowY:'auto', padding:'8px' },
  empty: { padding:'20px 12px', fontSize:'13px', color:'var(--text-muted)', textAlign:'center', lineHeight:'1.6' },
  item:  {
    display:'flex', alignItems:'center', gap:'8px',
    padding:'8px 10px', borderRadius:'7px', cursor:'pointer',
    transition:'background 0.1s', marginBottom:'2px',
  },
  itemName: {
    flex:1, fontSize:'13px', fontWeight:500, overflow:'hidden',
    textOverflow:'ellipsis', whiteSpace:'nowrap',
  },
  badge: {
    fontSize:'10px', background:'var(--bg)', color:'var(--text-muted)',
    border:'1px solid var(--border)', padding:'1px 6px',
    borderRadius:'10px', flexShrink:0,
  },
  delBtn: {
    background:'none', border:'1px solid transparent', borderRadius:'5px',
    cursor:'pointer', fontSize:'12px', padding:'3px 6px',
    color:'var(--danger)', flexShrink:0, lineHeight:1,
    transition:'background 0.1s, border-color 0.1s',
  },
  addRow: {
    padding:'10px 12px', borderTop:'1px solid var(--border)',
    display:'flex', gap:'6px',
  },
  addInput: {
    flex:1, padding:'8px 10px', border:'1px solid var(--border)',
    borderRadius:'7px', background:'var(--bg)', color:'var(--text)',
    fontSize:'13px', outline:'none',
  },
  addBtn: {
    background:'var(--accent)', color:'#fff', border:'none',
    borderRadius:'7px', padding:'8px 12px', fontSize:'13px',
    fontWeight:500, cursor:'pointer', whiteSpace:'nowrap',
  },
  footer: {
    padding:'8px 12px', borderTop:'1px solid var(--border)',
    fontSize:'11px', color:'var(--text-muted)',
  },
};

export default function Sidebar({
  db, activeTopic, onSelect, onAdd, onDelete,
  theme, onToggleTheme, getTopicStats,
  syncStatus, syncLabel, syncColor,
}) {
  const [filter,    setFilter]    = useState('');
  const [newTopic,  setNewTopic]  = useState('');
  const [adding,    setAdding]    = useState(false);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [showPin,   setShowPin]   = useState(false);
  const [delConfirm, setDelConfirm] = useState(null); // topic name pending delete

  // Restore admin state from sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem('admin_unlocked') === '1') setIsAdmin(true);
  }, []);

  const topics = Object.keys(db).filter(t =>
    t.toLowerCase().includes(filter.toLowerCase())
  );

  async function handleAdd() {
    const name = newTopic.trim();
    if (!name) return;
    if (db[name]) { alert('Topic already exists.'); return; }
    setAdding(true);
    try { await onAdd(name); setNewTopic(''); }
    finally { setAdding(false); }
  }

  function handleLockToggle() {
    if (isAdmin) {
      // Lock immediately
      sessionStorage.removeItem('admin_unlocked');
      setIsAdmin(false);
    } else {
      setShowPin(true);
    }
  }

  function handleUnlocked() {
    setIsAdmin(true);
    setShowPin(false);
  }

  async function handleDelete(topicName) {
    // First click sets pending; second click (confirm) executes
    if (delConfirm === topicName) {
      setDelConfirm(null);
      await onDelete(topicName);
    } else {
      setDelConfirm(topicName);
      // Auto-cancel after 3 seconds if user doesn't confirm
      setTimeout(() => setDelConfirm(c => c === topicName ? null : c), 3000);
    }
  }

  const topicCount = Object.keys(db).length;

  return (
    <>
      {showPin && (
        <PinModal
          onSuccess={handleUnlocked}
          onClose={() => setShowPin(false)}
        />
      )}

      <div style={s.sidebar}>

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.logo}>📚</div>
          <div>
            <div style={s.title}>Interview Prep</div>
            <div style={s.sub}>{topicCount} topic{topicCount !== 1 ? 's' : ''}</div>
          </div>
          {/* Lock/Unlock button */}
          <button
            style={{
              ...s.iconBtn,
              borderColor: isAdmin ? 'var(--success-border)' : 'var(--border)',
              color:        isAdmin ? 'var(--success)'        : 'var(--text-muted)',
              background:   isAdmin ? 'var(--success-bg)'     : 'none',
            }}
            onClick={handleLockToggle}
            title={isAdmin ? 'Click to lock admin mode' : 'Click to unlock admin mode'}
          >
            {isAdmin ? '🔓' : '🔒'}
          </button>
          {/* Theme toggle */}
          <button style={s.iconBtn} onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* ── Admin mode banner ── */}
        {isAdmin && (
          <div style={{
            padding:'6px 12px', fontSize:'11px', fontWeight:500,
            background:'var(--success-bg)', color:'var(--success)',
            borderBottom:'1px solid var(--success-border)',
            display:'flex', alignItems:'center', gap:'6px',
          }}>
            <span>🔓 Admin mode — you can add and delete topics</span>
          </div>
        )}

        {/* ── Search ── */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search topics…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        {/* ── Topic list ── */}
        <div style={s.list}>
          {topics.length === 0 ? (
            <div style={s.empty}>
              {filter
                ? 'No topics match your search.'
                : isAdmin
                  ? 'No topics yet — add one below.'
                  : 'No topics yet.'}
            </div>
          ) : topics.map(t => {
            const { total, reviewed } = getTopicStats(t);
            const isActive  = t === activeTopic;
            const isPending = delConfirm === t;

            return (
              <div
                key={t}
                style={{
                  ...s.item,
                  background: isPending
                    ? 'var(--danger-bg)'
                    : isActive
                      ? 'var(--accent-bg)'
                      : 'transparent',
                  border: isPending ? '1px solid var(--danger-border)' : '1px solid transparent',
                }}
                onClick={() => { setDelConfirm(null); onSelect(t); }}
              >
                <span style={{
                  ...s.itemName,
                  color: isPending
                    ? 'var(--danger)'
                    : isActive ? 'var(--accent-text)' : 'var(--text)',
                }} title={t}>{t}</span>

                {total > 0 && !isPending && (
                  <span style={{
                    ...s.badge,
                    background:  isActive ? 'var(--accent-bg)' : 'var(--bg)',
                    color:       isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  }}>{reviewed}/{total}</span>
                )}

                {isPending && (
                  <span style={{ fontSize:'11px', color:'var(--danger)', fontWeight:500, flexShrink:0 }}>
                    Tap 🗑 again to confirm
                  </span>
                )}

                {/* Delete button — only visible in admin mode */}
                {isAdmin && (
                  <button
                    style={{
                      ...s.delBtn,
                      background:   isPending ? 'var(--danger-bg)'    : 'transparent',
                      borderColor:  isPending ? 'var(--danger-border)' : 'transparent',
                    }}
                    onClick={e => { e.stopPropagation(); handleDelete(t); }}
                    title={isPending ? 'Confirm delete' : 'Delete topic'}
                  >
                    {isPending ? '✓ Delete' : '🗑'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Add topic — admin only ── */}
        {isAdmin && (
          <div style={s.addRow}>
            <input
              style={s.addInput}
              placeholder="e.g. Django ORM, Kubernetes…"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !adding && handleAdd()}
              disabled={adding}
              autoFocus
            />
            <button
              style={{ ...s.addBtn, opacity: adding ? 0.6 : 1 }}
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? '…' : '+ Add'}
            </button>
          </div>
        )}

        {/* ── Footer: sync status ── */}
        <div style={s.footer}>
          <span style={{ color: syncColor || 'var(--text-muted)' }}>
            {syncLabel || '✓ Synced'}
          </span>
          <div style={{ marginTop:'2px', color:'var(--text-muted)', fontSize:'10px' }}>
            Stored in Supabase · available on all devices
          </div>
        </div>

      </div>
    </>
  );
}

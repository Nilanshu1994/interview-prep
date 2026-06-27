import React, { useState } from 'react';

const s = {
  sidebar: {
    width: '272px', minWidth: '272px', background: 'var(--surface)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', overflow: 'hidden', height: '100%',
  },
  header: {
    padding: '16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  logo: {
    width: '34px', height: '34px', background: 'var(--accent)',
    borderRadius: '9px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '17px', flexShrink: 0,
  },
  title: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  sub: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' },
  themeBtn: {
    marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
    borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', fontSize: '14px',
    color: 'var(--text-secondary)', transition: 'background 0.12s',
  },
  searchWrap: { padding: '10px 12px', borderBottom: '1px solid var(--border)', position: 'relative' },
  searchIcon: {
    position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)',
    fontSize: '13px', color: 'var(--text-muted)', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '7px 10px 7px 28px', border: '1px solid var(--border)',
    borderRadius: '7px', background: 'var(--bg)', color: 'var(--text)',
    fontSize: '13px', outline: 'none',
  },
  list: { flex: 1, overflowY: 'auto', padding: '8px' },
  empty: { padding: '20px 12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' },
  item: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
    transition: 'background 0.1s', marginBottom: '2px',
  },
  itemName: {
    flex: 1, fontSize: '13px', fontWeight: 500, overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)',
  },
  badge: {
    fontSize: '10px', background: 'var(--bg)', color: 'var(--text-muted)',
    border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '10px', flexShrink: 0,
  },
  delBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: '13px', padding: '2px 5px', borderRadius: '4px',
    cursor: 'pointer', opacity: 0, transition: 'opacity 0.1s, color 0.1s',
  },
  addRow: {
    padding: '10px 12px', borderTop: '1px solid var(--border)',
    display: 'flex', gap: '6px',
  },
  addInput: {
    flex: 1, padding: '8px 10px', border: '1px solid var(--border)',
    borderRadius: '7px', background: 'var(--bg)', color: 'var(--text)',
    fontSize: '13px', outline: 'none',
  },
  addBtn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: '7px', padding: '8px 12px', fontSize: '13px',
    fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  keyBtn: {
    padding: '4px 8px', fontSize: '11px', background: 'none',
    border: '1px solid var(--border)', borderRadius: '6px',
    color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto',
  },
};

export default function Sidebar({ db, activeTopic, onSelect, onAdd, onDelete, onChangeToken, theme, onToggleTheme, getTopicStats }) {
  const [filter, setFilter] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [hoveredTopic, setHoveredTopic] = useState(null);

  const topics = Object.keys(db).filter((t) => t.toLowerCase().includes(filter.toLowerCase()));

  function handleAdd() {
    const name = newTopic.trim();
    if (!name) return;
    if (db[name]) { alert('Topic already exists'); return; }
    onAdd(name);
    setNewTopic('');
  }

  return (
    <div style={s.sidebar}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>📚</div>
        <div>
          <div style={s.title}>Interview Prep</div>
          <div style={s.sub}>{Object.keys(db).length} topic{Object.keys(db).length !== 1 ? 's' : ''}</div>
        </div>
        <button style={s.themeBtn} onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Search topics…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Topic list */}
      <div style={s.list}>
        {topics.length === 0 ? (
          <div style={s.empty}>{filter ? 'No matches.' : 'Add a topic below to begin.'}</div>
        ) : (
          topics.map((t) => {
            const { total, reviewed } = getTopicStats(t);
            const isActive = t === activeTopic;
            return (
              <div
                key={t}
                style={{
                  ...s.item,
                  background: isActive ? 'var(--accent-bg)' : hoveredTopic === t ? 'var(--bg)' : 'transparent',
                }}
                onClick={() => onSelect(t)}
                onMouseEnter={() => setHoveredTopic(t)}
                onMouseLeave={() => setHoveredTopic(null)}
              >
                <span style={{ ...s.itemName, color: isActive ? 'var(--accent-text)' : 'var(--text)' }} title={t}>{t}</span>
                {total > 0 && (
                  <span style={{
                    ...s.badge,
                    background: isActive ? 'var(--accent-bg)' : 'var(--bg)',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  }}>
                    {reviewed}/{total}
                  </span>
                )}
                <button
                  style={{ ...s.delBtn, opacity: hoveredTopic === t ? 1 : 0 }}
                  onClick={(e) => { e.stopPropagation(); onDelete(t); }}
                  title="Delete topic"
                >✕</button>
              </div>
            );
          })
        )}
      </div>

      {/* Add row */}
      <div style={s.addRow}>
        <input
          style={s.addInput}
          placeholder="e.g. Django ORM, Kubernetes…"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button style={s.addBtn} onClick={handleAdd}>+ Add</button>
      </div>

      {/* Change token */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GitHub Models</span>
        <button style={s.keyBtn} onClick={onChangeToken}>🔑 Change token</button>
      </div>
    </div>
  );
}

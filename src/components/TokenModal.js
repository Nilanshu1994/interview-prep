import React, { useState } from 'react';

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  box: {
    background: 'var(--surface)', borderRadius: '14px',
    padding: '32px', maxWidth: '440px', width: '100%',
    border: '1px solid var(--border)',
  },
  icon: { fontSize: '28px', marginBottom: '12px' },
  h2: { fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' },
  p: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '20px' },
  steps: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '14px 16px', marginBottom: '18px',
  },
  stepTitle: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
  step: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '7px', display: 'flex', gap: '8px' },
  stepNum: { color: 'var(--accent)', fontWeight: 600, flexShrink: 0 },
  link: { color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none',
    marginBottom: '6px',
  },
  hint: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' },
  error: { fontSize: '12px', color: 'var(--danger)', marginBottom: '10px' },
  btn: {
    width: '100%', padding: '11px', background: 'var(--accent)',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
  },
};

export default function TokenModal({ onSave }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const t = token.trim();
    if (!t) { setError('Paste your GitHub token above.'); return; }
    if (!t.startsWith('ghp_') && !t.startsWith('github_pat_')) {
      setError('Token should start with ghp_ or github_pat_');
      return;
    }
    localStorage.setItem('gh_token', t);
    onSave();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <div style={styles.icon}>🔑</div>
        <h2 style={styles.h2}>Connect GitHub Models (free)</h2>
        <p style={styles.p}>
          This app uses GitHub Models — completely free AI inference powered by your GitHub account.
          No billing, no credit card.
        </p>
        <div style={styles.steps}>
          <div style={styles.stepTitle}>How to get your free token</div>
          <div style={styles.step}><span style={styles.stepNum}>1.</span><span>Go to <a style={styles.link} href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer">github.com/settings/tokens</a></span></div>
          <div style={styles.step}><span style={styles.stepNum}>2.</span><span>Click <strong>Generate new token (classic)</strong></span></div>
          <div style={styles.step}><span style={styles.stepNum}>3.</span><span>Give it any name — no scopes needed, just scroll down and click <strong>Generate token</strong></span></div>
          <div style={styles.step}><span style={styles.stepNum}>4.</span><span>Copy the token and paste it below</span></div>
        </div>
        <label style={styles.label}>GitHub Personal Access Token</label>
        <input
          style={styles.input}
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={(e) => { setToken(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div style={styles.hint}>Saved to your browser only. Never sent anywhere except GitHub's API.</div>
        {error && <div style={styles.error}>⚠ {error}</div>}
        <button style={styles.btn} onClick={handleSave}>Save and start →</button>
      </div>
    </div>
  );
}

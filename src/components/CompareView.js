import React, { useState } from 'react';

// ── Code block renderer (same logic as QuestionView) ─────────────────────────
function CodeBlock({ code }) {
  return (
    <pre style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: '7px', padding: '12px 14px', margin: '8px 0',
      overflowX: 'auto', fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
      fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre', color: 'var(--text)',
    }}>{code}</pre>
  );
}

function Prose({ text }) {
  if (!text) return null;
  return (
    <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text)', margin: '6px 0' }}>
      {text}
    </p>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      marginBottom: '10px', paddingBottom: '6px',
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  );
}

// ── Single shared-concept card ────────────────────────────────────────────────
function ConceptCard({ concept, topicA, topicB, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: '10px',
      overflow: 'hidden', background: 'var(--surface)',
    }}>
      {/* Accordion header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
          {concept.concept}
        </span>
        <span style={{ fontSize: '16px', color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Topic A */}
            <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--accent-text)',
                background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: '6px',
                display: 'inline-block', marginBottom: '8px',
              }}>{topicA}</div>
              <Prose text={concept.topic_a?.explanation} />
              {concept.topic_a?.code && <CodeBlock code={concept.topic_a.code} />}
            </div>

            {/* Topic B */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#7c3aed',
                background: '#f5f3ff', padding: '2px 8px', borderRadius: '6px',
                display: 'inline-block', marginBottom: '8px',
              }}>{topicB}</div>
              <Prose text={concept.topic_b?.explanation} />
              {concept.topic_b?.code && <CodeBlock code={concept.topic_b.code} />}
            </div>
          </div>

          {/* Difference strip */}
          {concept.difference && (
            <div style={{
              borderTop: '1px solid var(--border)',
              padding: '10px 16px',
              background: 'var(--warning-bg)',
              display: 'flex', gap: '8px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '13px', flexShrink: 0 }}>⚡</span>
              <span style={{ fontSize: '13px', color: 'var(--warning)', lineHeight: '1.6' }}>
                <strong>Key difference:</strong> {concept.difference}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Unique features list ──────────────────────────────────────────────────────
function UniqueList({ items, topicName, color, bg }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '16px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color,
        background: bg, padding: '2px 8px', borderRadius: '6px',
        display: 'inline-block', marginBottom: '12px',
      }}>Only in {topicName}</div>
      <ul style={{ paddingLeft: '18px', margin: 0 }}>
        {(items || []).map((item, i) => (
          <li key={i} style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text)', marginBottom: '3px' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── When to use card ──────────────────────────────────────────────────────────
function WhenCard({ topicName, text, color, bg }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '16px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color,
        background: bg, padding: '2px 8px', borderRadius: '6px',
        display: 'inline-block', marginBottom: '10px',
      }}>When to use {topicName}</div>
      <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text)' }}>{text}</p>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
      fontSize: '14px', color: 'var(--text-secondary)',
    }}>
      <div style={{
        width: '18px', height: '18px', flexShrink: 0,
        border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      }} />
      {label}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main CompareView ──────────────────────────────────────────────────────────
export default function CompareView({ topics, getComparison, runComparison, deleteComparison }) {
  const topicNames = Object.keys(topics);

  const [topicA,   setTopicA]   = useState('');
  const [topicB,   setTopicB]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState(null);   // currently displayed comparison

  // Colours for A and B
  const colA = { color: 'var(--accent-text)',  bg: 'var(--accent-bg)' };
  const colB = { color: '#7c3aed',             bg: '#f5f3ff'          };

  async function handleCompare() {
    if (!topicA || !topicB)           { setError('Select two topics.'); return; }
    if (topicA === topicB)             { setError('Pick two different topics.'); return; }
    setError(''); setLoading(true); setResult(null);

    // Check cache first
    const cached = getComparison(topicA, topicB);
    if (cached) { setResult({ topicA, topicB, data: cached }); setLoading(false); return; }

    try {
      const data = await runComparison(topicA, topicB);
      setResult({ topicA, topicB, data });
    } catch(e) {
      setError(e.message === 'PROXY_URL_MISSING'
        ? 'Proxy URL not configured — see setup instructions.'
        : e.message);
    } finally { setLoading(false); }
  }

  async function handleRegenerate() {
    if (!result) return;
    await deleteComparison(result.topicA, result.topicB);
    setResult(null); setLoading(true);
    try {
      const data = await runComparison(result.topicA, result.topicB);
      setResult({ topicA: result.topicA, topicB: result.topicB, data });
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function handleExport() {
    if (!result) return;
    const { topicA: a, topicB: b, data: d } = result;
    const lines = [`# ${a} vs ${b} — Comparison\n`, `\n${d.summary}\n`];

    lines.push(`\n## Shared Concepts\n`);
    (d.shared_concepts || []).forEach(c => {
      lines.push(`\n### ${c.concept}\n`);
      lines.push(`**${a}:** ${c.topic_a?.explanation}\n\`\`\`\n${c.topic_a?.code}\n\`\`\`\n`);
      lines.push(`**${b}:** ${c.topic_b?.explanation}\n\`\`\`\n${c.topic_b?.code}\n\`\`\`\n`);
      lines.push(`**Key difference:** ${c.difference}\n`);
    });

    lines.push(`\n## Only in ${a}\n`);
    (d.only_in_a || []).forEach(i => lines.push(`- ${i}\n`));
    lines.push(`\n## Only in ${b}\n`);
    (d.only_in_b || []).forEach(i => lines.push(`- ${i}\n`));

    lines.push(`\n## When to use ${a}\n${d.when_to_use_a}\n`);
    lines.push(`\n## When to use ${b}\n${d.when_to_use_b}\n`);

    navigator.clipboard.writeText(lines.join('\n'))
      .then(()  => alert('Comparison copied — paste into Notion, Obsidian, or any editor'))
      .catch(() => alert('Copy failed'));
  }

  const selectStyle = {
    padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg)', color: 'var(--text)', fontSize: '14px',
    outline: 'none', cursor: 'pointer', flex: 1, minWidth: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
          ⚖ Compare topics
        </div>

        {/* Selector row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select value={topicA} onChange={e => setTopicA(e.target.value)} style={selectStyle}>
            <option value="">Select topic A…</option>
            {topicNames.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <span style={{ fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0 }}>vs</span>

          <select value={topicB} onChange={e => setTopicB(e.target.value)} style={selectStyle}>
            <option value="">Select topic B…</option>
            {topicNames.map(t => (
              <option key={t} value={t} disabled={t === topicA}>{t}</option>
            ))}
          </select>

          <button
            onClick={handleCompare}
            disabled={loading || !topicA || !topicB}
            style={{
              padding: '9px 18px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: loading || !topicA || !topicB ? 'not-allowed' : 'pointer',
              opacity: loading || !topicA || !topicB ? 0.5 : 1, flexShrink: 0,
            }}
          >
            {loading ? '…' : 'Compare →'}
          </button>

          {result && (
            <>
              <button onClick={handleRegenerate} disabled={loading} style={{
                padding: '9px 14px', background: 'none', border: '1px solid var(--border)',
                borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)',
                cursor: 'pointer', flexShrink: 0,
              }}>↻ Regenerate</button>
              <button onClick={handleExport} style={{
                padding: '9px 14px', background: 'none', border: '1px solid var(--border)',
                borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)',
                cursor: 'pointer', flexShrink: 0,
              }}>⬇ Export</button>
            </>
          )}
        </div>

        {error && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--danger)' }}>⚠ {error}</div>
        )}

        {/* Cache hint */}
        {topicA && topicB && topicA !== topicB && getComparison(topicA, topicB) && !result && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--success)' }}>
            ✓ Saved comparison found — will load instantly
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {topicNames.length < 2 && (
          <div style={{
            padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
          }}>
            Add at least 2 topics in the sidebar to compare them.
          </div>
        )}

        {loading && <Spinner label={`Generating comparison between "${topicA}" and "${topicB}"… (this may take ~15 seconds)`} />}

        {!loading && result && (() => {
          const { topicA: a, topicB: b, data: d } = result;
          return (
            <>
              {/* Summary */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '18px 20px',
              }}>
                <SectionLabel>Overview</SectionLabel>
                <p style={{ fontSize: '14px', lineHeight: '1.75', color: 'var(--text)' }}>{d.summary}</p>
              </div>

              {/* Shared concepts */}
              <div>
                <SectionLabel>Shared concepts — side by side</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(d.shared_concepts || []).map((c, i) => (
                    <ConceptCard
                      key={i}
                      concept={c}
                      topicA={a}
                      topicB={b}
                      defaultOpen={i === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Unique features */}
              <div>
                <SectionLabel>Unique features</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <UniqueList items={d.only_in_a} topicName={a} {...colA} />
                  <UniqueList items={d.only_in_b} topicName={b} {...colB} />
                </div>
              </div>

              {/* When to use */}
              <div>
                <SectionLabel>When to use each</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <WhenCard topicName={a} text={d.when_to_use_a} {...colA} />
                  <WhenCard topicName={b} text={d.when_to_use_b} {...colB} />
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

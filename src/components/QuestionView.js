import React, { useState, useEffect } from 'react';
import { generateQuestions, regenerateOne } from '../api';

function formatAnswer(text) {
  if (!text) return [];
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
      return (
        <pre key={i} style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px 16px', margin: '12px 0',
          overflowX: 'auto', fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: '12.5px', lineHeight: '1.65', whiteSpace: 'pre', wordBreak: 'normal',
          color: 'var(--text)',
        }}>{code}</pre>
      );
    }
    const paras = part.split(/\n\n+/);
    return paras.map((para, j) => (
      <p key={`${i}-${j}`} style={{ marginBottom: '0.75em', lineHeight: '1.75', fontSize: '14px', color: 'var(--text)' }}>
        {para.split('\n').map((line, k) => (
          <React.Fragment key={k}>{line}{k < para.split('\n').length - 1 && <br />}</React.Fragment>
        ))}
      </p>
    ));
  });
}

const DIFFS = ['easy', 'medium', 'hard'];
const DIFF_LABELS = { easy: 'Basic', medium: 'Intermediate', hard: 'Advanced' };
const DIFF_COLORS = {
  easy:   { bg: 'var(--success-bg)',  text: 'var(--success)',  border: 'var(--success-border)' },
  medium: { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning-border)' },
  hard:   { bg: 'var(--danger-bg)',  text: 'var(--danger)',   border: 'var(--danger-border)' },
};

export default function QuestionView({
  topicName, topicData,
  setQuestions, setQuestion, setIdx,
  toggleReviewed, saveNote,
  onTokenError,
}) {
  const [diff, setDiff] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  const diffData = topicData?.[diff] || { questions: [], idx: 0 };
  const questions = diffData.questions || [];
  const idx = diffData.idx || 0;
  const current = questions[idx];
  const total = questions.length;

  // Auto-generate when switching to a diff with no questions
  useEffect(() => {
    if (!loading && questions.length === 0) {
      handleGenerate();
    }
    // eslint-disable-next-line
  }, [diff, topicName]);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const qs = await generateQuestions(topicName, diff);
      setQuestions(topicName, diff, qs);
    } catch (e) {
      if (e.message === 'NO_TOKEN' || e.message === 'BAD_TOKEN') { onTokenError(); return; }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegen() {
    setRegenLoading(true);
    try {
      const q = await regenerateOne(topicName, diff, questions);
      setQuestion(topicName, diff, idx, q);
    } catch (e) {
      if (e.message === 'NO_TOKEN' || e.message === 'BAD_TOKEN') { onTokenError(); return; }
    } finally {
      setRegenLoading(false);
    }
  }

  function handleExport() {
    const lines = [`# ${topicName} — Interview Q&A\n`];
    DIFFS.forEach((d) => {
      const qs = topicData?.[d]?.questions;
      if (!qs?.length) return;
      lines.push(`\n## ${DIFF_LABELS[d]}\n`);
      qs.forEach((q, i) => {
        lines.push(`\n### Q${i + 1}: ${q.q}\n\n${q.a}\n`);
        if (q.note) lines.push(`\n> **My notes:** ${q.note}\n`);
        lines.push('\n---');
      });
    });
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => alert('Copied to clipboard — paste into Notion, Obsidian, or any editor'))
      .catch(() => alert('Could not copy automatically. Use Ctrl+A and Ctrl+C on the textarea.'));
  }

  const colors = DIFF_COLORS[diff];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{topicName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {DIFFS.reduce((a, d) => a + (topicData?.[d]?.questions?.filter(q => q.reviewed).length || 0), 0)} /
            {DIFFS.reduce((a, d) => a + (topicData?.[d]?.questions?.length || 0), 0)} reviewed across all levels
          </div>
        </div>

        {/* Difficulty tabs */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {DIFFS.map((d) => (
            <button key={d} onClick={() => setDiff(d)} style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
              border: `1px solid ${d === diff ? DIFF_COLORS[d].border : 'var(--border)'}`,
              background: d === diff ? DIFF_COLORS[d].bg : 'none',
              color: d === diff ? DIFF_COLORS[d].text : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {DIFF_LABELS[d]}
            </button>
          ))}
        </div>

        <button onClick={handleExport} style={{
          padding: '5px 11px', borderRadius: '7px', fontSize: '12px',
          border: '1px solid var(--border)', background: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>⬇ Export</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '20px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: '10px',
            fontSize: '14px', color: 'var(--text-secondary)',
          }}>
            <div style={{
              width: '18px', height: '18px',
              border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
            }} />
            Generating {DIFF_LABELS[diff].toLowerCase()} questions on "{topicName}"…
          </div>
        )}

        {error && !loading && (
          <div style={{
            padding: '18px 20px', background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)', borderRadius: '10px',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '12px' }}>⚠ {error}</p>
            <button onClick={handleGenerate} style={{
              padding: '7px 14px', background: 'none', border: '1px solid var(--danger)',
              borderRadius: '7px', color: 'var(--danger)', fontSize: '13px', cursor: 'pointer',
            }}>↻ Retry</button>
          </div>
        )}

        {!loading && !error && current && (
          <>
            {/* Question card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q{idx + 1} of {total}</span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: colors.bg, color: colors.text,
                }}>{DIFF_LABELS[diff]}</span>
                {current.reviewed && (
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '10px',
                    background: 'var(--accent-bg)', color: 'var(--accent-text)',
                  }}>✓ Reviewed</span>
                )}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, lineHeight: '1.5', color: 'var(--text)' }}>
                {current.q}
              </div>
            </div>

            {/* Answer card */}
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '20px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px',
              }}>Answer</div>
              <div>{formatAnswer(current.a)}</div>
            </div>

            {/* Notes card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
              }}>📝 My notes</div>
              <textarea
                value={current.note || ''}
                onChange={(e) => saveNote(topicName, diff, idx, e.target.value)}
                placeholder="Write your understanding, key points, or memory triggers here…"
                style={{
                  width: '100%', border: '1px solid var(--border)', borderRadius: '7px',
                  padding: '9px 11px', fontSize: '13px', background: 'var(--bg)',
                  color: 'var(--text)', resize: 'vertical', lineHeight: '1.6',
                  outline: 'none', minHeight: '68px',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Action row */}
      {!loading && current && (
        <div style={{
          padding: '10px 20px', background: 'var(--surface)',
          borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexShrink: 0,
        }}>
          <button onClick={() => toggleReviewed(topicName, diff, idx)} style={{
            padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
            border: `1px solid ${current.reviewed ? 'var(--success-border)' : 'var(--border)'}`,
            background: current.reviewed ? 'var(--success-bg)' : 'none',
            color: current.reviewed ? 'var(--success)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            {current.reviewed ? '✓ Reviewed' : '○ Mark reviewed'}
          </button>
          <button onClick={handleRegen} disabled={regenLoading} style={{
            padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
            border: '1px solid var(--border)', background: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            opacity: regenLoading ? 0.5 : 1,
          }}>
            {regenLoading ? '…' : '↻ New question'}
          </button>
        </div>
      )}

      {/* Nav bar */}
      {!loading && total > 0 && (
        <div style={{
          padding: '12px 20px', background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
        }}>
          <button
            disabled={idx === 0}
            onClick={() => setIdx(topicName, diff, idx - 1)}
            style={{
              padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: 500,
              border: '1px solid var(--border)', background: 'none', color: 'var(--text)',
              cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.35 : 1,
            }}>← Prev</button>

          {/* Dots */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {questions.map((q, i) => (
              <button key={i} onClick={() => setIdx(topicName, diff, i)} style={{
                width: '8px', height: '8px', borderRadius: '50%', border: 'none', padding: 0,
                cursor: 'pointer',
                background: i === idx ? 'var(--text)' : q.reviewed ? 'var(--accent)' : 'var(--border-strong)',
                transform: i === idx ? 'scale(1.35)' : 'scale(1)',
                transition: 'all 0.15s',
              }} title={`Q${i + 1}${q.reviewed ? ' (reviewed)' : ''}`} />
            ))}
          </div>

          <button
            disabled={idx === total - 1}
            onClick={() => setIdx(topicName, diff, idx + 1)}
            style={{
              padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: 500,
              border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff',
              cursor: idx === total - 1 ? 'not-allowed' : 'pointer', opacity: idx === total - 1 ? 0.35 : 1,
            }}>Next →</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { generateQuestions, regenerateOne } from '../api';

// ── Answer renderer ───────────────────────────────────────────────────────────
function AnswerContent({ text }) {
  if (!text) return null;
  return (
    <>
      {text.split(/(```[\s\S]*?```)/g).map((part, i) => {
        if (part.startsWith('```')) {
          const lang = part.match(/```(\w+)/)?.[1] || '';
          const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
          return (
            <div key={i}>
              {lang && (
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>
                  {lang}
                </div>
              )}
              <pre className="code-block">{code}</pre>
            </div>
          );
        }
        return part.split(/\n\n+/).filter(Boolean).map((para, j) => (
          <p key={`${i}-${j}`} style={{ marginBottom:'0.85em', lineHeight:1.8, fontSize:15, color:'var(--text-2)' }}>
            {para.split('\n').map((line, k, arr) => (
              <React.Fragment key={k}>{line}{k < arr.length - 1 && <br />}</React.Fragment>
            ))}
          </p>
        ));
      })}
    </>
  );
}

// ── One question card — self-contained ────────────────────────────────────────
function QCard({ q, idx, topicName, onReviewed, onNote, onRegen, regenLoading }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTips,   setShowTips]   = useState(false);

  // Reset reveal when question changes
  useEffect(() => { setShowAnswer(false); setShowTips(false); }, [idx, topicName]);

  return (
    <div className="card animate-fadein" style={{ borderLeft: '3px solid var(--accent)' }}>

      {/* Question */}
      <div style={{ padding:'18px 20px 14px', position:'relative' }}>
        {/* Watermark number */}
        <div style={{
          position:'absolute', top:10, right:14, fontSize:48, fontWeight:800,
          color:'var(--border)', lineHeight:1, userSelect:'none', pointerEvents:'none',
        }}>
          {String(idx + 1).padStart(2, '0')}
        </div>

        {/* tiny meta */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
          <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:500 }}>Q{idx + 1}</span>
          {q.reviewed && (
            <span style={{ fontSize:10, fontWeight:600, color:'var(--green)', background:'var(--green-2)', border:'1px solid var(--green-3)', padding:'1px 6px', borderRadius:10 }}>
              ✓ done
            </span>
          )}
        </div>

        {/* Question text — the star of the show */}
        <div style={{ fontSize:18, fontWeight:700, lineHeight:1.45, color:'var(--text)', marginRight:52, paddingBottom:2 }}>
          {q.q}
        </div>
      </div>

      {/* Show answer trigger */}
      {!showAnswer && (
        <div style={{ padding:'0 20px 16px' }}>
          <button
            onClick={() => setShowAnswer(true)}
            style={{
              width:'100%', padding:'10px', borderRadius:8,
              background:'var(--accent)', color:'#fff', border:'none',
              fontSize:13, fontWeight:600, cursor:'pointer', letterSpacing:'0.01em',
            }}
          >
            Show Answer →
          </button>
        </div>
      )}

      {/* Answer + tips */}
      {showAnswer && (
        <div className="answer-body" style={{ borderTop:'1px solid var(--border)' }}>
          {/* Answer body */}
          <div style={{ padding:'16px 20px', background:'var(--surface2)' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:12 }}>
              Answer
            </div>
            <AnswerContent text={q.a} />
          </div>

          {/* Tips accordion */}
          {q.tips?.length > 0 && (
            <div style={{ borderTop:'1px solid var(--border)' }}>
              <button
                onClick={() => setShowTips(s => !s)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 20px', background:'none', border:'none', cursor:'pointer',
                  fontSize:12, fontWeight:600, color:'var(--amber)',
                }}
              >
                <span>💡 Interview tips ({q.tips.length})</span>
                <span style={{ fontSize:11, transform: showTips ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
              </button>
              {showTips && (
                <div className="answer-body" style={{ padding:'0 20px 14px', display:'flex', flexDirection:'column', gap:7 }}>
                  {q.tips.map((tip, i) => (
                    <div key={i} className="tip-block">
                      <div className="tip-label">Tip {i + 1}</div>
                      {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div style={{ borderTop:'1px solid var(--border)', padding:'10px 20px 14px' }}>
            <textarea
              className="textarea"
              style={{ minHeight:56, fontSize:13, background:'var(--bg)' }}
              placeholder="My notes…"
              value={q.note || ''}
              onChange={e => onNote(e.target.value)}
            />
          </div>

          {/* Inline action row — tiny */}
          <div style={{ borderTop:'1px solid var(--border)', padding:'8px 20px', display:'flex', gap:6, alignItems:'center' }}>
            <button
              onClick={onReviewed}
              style={{
                padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer',
                border:`1px solid ${q.reviewed ? 'var(--green-3)' : 'var(--border)'}`,
                background: q.reviewed ? 'var(--green-2)' : 'none',
                color: q.reviewed ? 'var(--green)' : 'var(--text-3)',
              }}
            >
              {q.reviewed ? '✓ Reviewed' : '○ Mark done'}
            </button>
            <button
              onClick={onRegen}
              disabled={regenLoading}
              style={{
                padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer',
                border:'1px solid var(--border)', background:'none', color:'var(--text-3)',
                opacity: regenLoading ? 0.5 : 1,
              }}
            >
              {regenLoading ? '…' : '↻ swap'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function QuestionView({
  topicName, topicData,
  setQuestions, appendQuestions, setIdx,
  toggleReviewed, saveNote, replaceQuestion,
}) {
  const [loading,   setLoading]  = useState(false);
  const [loadingMore, setMore]   = useState(false);
  const [error,     setError]    = useState('');
  const [regenIdx,  setRegenIdx] = useState(null);
  const bodyRef  = useRef(null);
  const chipRef  = useRef(null);

  const questions = topicData?.questions || [];
  const idx       = Math.max(0, Math.min(topicData?.idx || 0, questions.length - 1));
  const current   = questions[idx];
  const total     = questions.length;
  const reviewed  = questions.filter(q => q.reviewed).length;
  const pct       = total ? Math.round(reviewed / total * 100) : 0;

  // Auto-load first batch
  useEffect(() => {
    if (!loading && questions.length === 0) handleGenerate();
    // eslint-disable-next-line
  }, [topicName]);

  // Scroll question area to top when idx changes
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx]);

  // Keep active chip in view
  useEffect(() => {
    if (!chipRef.current) return;
    const active = chipRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ inline: 'center', behavior: 'smooth' });
  }, [idx]);

  async function handleGenerate() {
    setLoading(true); setError('');
    try {
      const qs = await generateQuestions(topicName, []);
      await setQuestions(topicName, qs);
    } catch(e) {
      setError(e.message === 'PROXY_URL_MISSING' ? 'Proxy URL not configured.' : e.message);
    } finally { setLoading(false); }
  }

  async function handleLoadMore() {
    setMore(true);
    try {
      const qs = await generateQuestions(topicName, questions);
      await appendQuestions(topicName, qs);
    } catch(e) { /* silent */ }
    finally { setMore(false); }
  }

  async function handleRegen(i) {
    setRegenIdx(i);
    try {
      const q = await regenerateOne(topicName, questions);
      await replaceQuestion(topicName, i, q);
    } catch(e) { /* silent */ }
    finally { setRegenIdx(null); }
  }

  function goTo(i) {
    const clamped = Math.max(0, Math.min(i, total - 1));
    setIdx(topicName, clamped);
  }

  function handleExport() {
    const lines = [`# ${topicName} — Interview Q&A\n`];
    questions.forEach((q, i) => {
      lines.push(`\n## Q${i + 1}: ${q.q}\n\n${q.a}\n`);
      if (q.tips?.length) { lines.push('**Tips:**'); q.tips.forEach(t => lines.push(`- ${t}`)); lines.push(''); }
      if (q.note) lines.push(`> My notes: ${q.note}\n`);
      lines.push('---');
    });
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => alert('Copied!'))
      .catch(() => alert('Copy failed'));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Compact top bar ── */}
      <div style={{
        padding:'8px 14px', background:'var(--surface)',
        borderBottom:'1px solid var(--border)', flexShrink:0,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {topicName}
          </div>
          {total > 0 && (
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>
              {reviewed}/{total} reviewed · {pct}%
            </div>
          )}
        </div>
        {/* Thin progress bar */}
        {total > 0 && (
          <div style={{ flex:1, maxWidth:120 }}>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{
                width:`${pct}%`,
                background: pct === 100 ? 'var(--green)' : 'var(--accent)',
              }} />
            </div>
          </div>
        )}
        <button
          onClick={handleExport}
          title="Export all Q&A"
          style={{ padding:'4px 8px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'none', color:'var(--text-3)', cursor:'pointer', flexShrink:0 }}
        >⬇</button>
      </div>

      {/* ── Scrollable chip nav ── */}
      {total > 0 && (
        <div
          ref={chipRef}
          style={{
            display:'flex', gap:4, overflowX:'auto', padding:'6px 14px',
            background:'var(--surface)', borderBottom:'1px solid var(--border)',
            scrollbarWidth:'none', msOverflowStyle:'none', flexShrink:0,
          }}
        >
          {questions.map((q, i) => (
            <button
              key={i}
              data-active={i === idx ? 'true' : 'false'}
              onClick={() => goTo(i)}
              style={{
                minWidth:30, height:30, borderRadius:6, border:'1px solid',
                borderColor: i === idx ? 'var(--accent)' : q.reviewed ? 'var(--green-3)' : 'var(--border)',
                background:  i === idx ? 'var(--accent)' : q.reviewed ? 'var(--green-2)' : 'var(--surface2)',
                color:       i === idx ? '#fff' : q.reviewed ? 'var(--green)' : 'var(--text-3)',
                fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.1s',
              }}
            >{i + 1}</button>
          ))}
          {/* Inline load more chip */}
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              minWidth:46, height:30, borderRadius:6, border:'1px dashed var(--border)',
              background:'none', color:'var(--text-3)', fontSize:10, fontWeight:600,
              cursor:'pointer', flexShrink:0, whiteSpace:'nowrap', padding:'0 8px',
            }}
          >
            {loadingMore ? '…' : '+ more'}
          </button>
        </div>
      )}

      {/* ── Main body — question card ── */}
      <div ref={bodyRef} style={{ flex:1, overflowY:'auto', padding:'14px' }}>

        {/* Loading state */}
        {loading && (
          <div className="card animate-fadein" style={{ padding:'32px 20px', textAlign:'center' }}>
            <div className="spinner spinner-lg" style={{ margin:'0 auto 14px' }} />
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:5 }}>Generating questions…</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>10 questions on "{topicName}"</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="card animate-fadein" style={{ padding:'16px 20px', borderColor:'var(--red-3)', background:'var(--red-2)' }}>
            <div style={{ fontSize:13, color:'var(--red)', marginBottom:10 }}>⚠ {error}</div>
            <button
              onClick={handleGenerate}
              style={{ padding:'6px 12px', borderRadius:6, fontSize:12, border:'1px solid var(--red-3)', background:'none', color:'var(--red)', cursor:'pointer' }}
            >↻ Retry</button>
          </div>
        )}

        {/* The question */}
        {!loading && !error && current && (
          <QCard
            key={`${topicName}-${idx}`}
            q={current}
            idx={idx}
            topicName={topicName}
            onReviewed={() => toggleReviewed(topicName, idx)}
            onNote={note => saveNote(topicName, idx, note)}
            onRegen={() => handleRegen(idx)}
            regenLoading={regenIdx === idx}
          />
        )}
      </div>

      {/* ── Compact bottom nav — Prev / Next only ── */}
      {!loading && total > 0 && (
        <div style={{
          padding:'8px 14px', background:'var(--surface)',
          borderTop:'1px solid var(--border)', flexShrink:0,
          display:'flex', gap:8,
        }}>
          <button
            disabled={idx === 0}
            onClick={() => goTo(idx - 1)}
            style={{
              flex:1, padding:'9px', borderRadius:8, fontSize:13, fontWeight:600,
              border:'1px solid var(--border)', background:'none', color:'var(--text)',
              cursor: idx === 0 ? 'not-allowed' : 'pointer',
              opacity: idx === 0 ? 0.35 : 1,
            }}
          >← Prev</button>
          <button
            onClick={() => idx < total - 1 ? goTo(idx + 1) : handleLoadMore()}
            disabled={loadingMore}
            style={{
              flex:1, padding:'9px', borderRadius:8, fontSize:13, fontWeight:600,
              border:'1px solid var(--accent)', background:'var(--accent)', color:'#fff',
              cursor:'pointer', opacity: loadingMore ? 0.6 : 1,
            }}
          >
            {loadingMore ? '…'
              : idx < total - 1 ? 'Next →'
              : '+ Load 10 more →'}
          </button>
        </div>
      )}
    </div>
  );
}

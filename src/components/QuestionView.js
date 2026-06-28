import React, { useState, useEffect, useRef } from 'react';
import { generateQuestions, regenerateOne } from '../api';

// ── Answer formatter ──────────────────────────────────────────────────────────
function AnswerContent({ text }) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lang = part.match(/```(\w+)/)?.[1] || '';
          const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
          return (
            <div key={i}>
              {lang && <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{lang}</div>}
              <pre className="code-block">{code}</pre>
            </div>
          );
        }
        return part.split(/\n\n+/).filter(Boolean).map((para, j) => (
          <p key={`${i}-${j}`} style={{ marginBottom:'0.9em', lineHeight:1.8, fontSize:15, color:'var(--text-2)' }}>
            {para.split('\n').map((line, k, arr) => (
              <React.Fragment key={k}>{line}{k < arr.length-1 && <br/>}</React.Fragment>
            ))}
          </p>
        ));
      })}
    </>
  );
}

const DIFFS  = ['easy','medium','hard'];
const DLABEL = { easy:'Basic', medium:'Intermediate', hard:'Advanced' };
const DCOLOR = {
  easy:   'easy',
  medium: 'medium',
  hard:   'hard',
};

// ── Single question card ──────────────────────────────────────────────────────
function QuestionCard({ q, idx, total, diff, topicName, onToggleReviewed, onSaveNote, onRegen, regenLoading }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTips,   setShowTips]   = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  // Reset reveal when question changes
  useEffect(() => { setShowAnswer(false); setShowTips(false); }, [idx, topicName, diff]);

  function handleReviewed() {
    if (!q.reviewed) { setCelebrated(true); setTimeout(() => setCelebrated(false), 600); }
    onToggleReviewed();
  }

  const hasTips = q.tips && q.tips.length > 0;

  return (
    <div className={`animate-fadein${celebrated ? ' animate-celebrate' : ''}`}
      style={{ display:'flex', flexDirection:'column', gap:14 }}
    >
      {/* ── Question card ── */}
      <div className="card" style={{
        borderLeft: `4px solid var(--${DCOLOR[diff]==='easy'?'green':DCOLOR[diff]==='medium'?'amber':'red'})`,
        position:'relative', overflow:'visible',
      }}>
        {/* Big question number watermark */}
        <div style={{
          position:'absolute', top:12, right:16,
          fontSize:56, fontWeight:800, color:'var(--border)',
          lineHeight:1, userSelect:'none', pointerEvents:'none',
          fontVariantNumeric:'tabular-nums',
        }}>
          {String(idx+1).padStart(2,'0')}
        </div>

        <div style={{ padding:'20px 24px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            <span className={`badge badge-${DCOLOR[diff]}`}>{DLABEL[diff]}</span>
            <span style={{ fontSize:12, color:'var(--text-3)' }}>{idx+1} of {total}</span>
            {q.reviewed && <span className="badge badge-accent" style={{ fontSize:10 }}>✓ Reviewed</span>}
          </div>

          <div style={{ fontSize:19, fontWeight:700, lineHeight:1.45, color:'var(--text)', marginRight:56, paddingBottom:4 }}>
            {q.q}
          </div>
        </div>

        {/* Show answer button */}
        {!showAnswer && (
          <div style={{ padding:'0 24px 20px' }}>
            <button
              className="btn btn-primary btn-lg btn-full"
              style={{ borderRadius:10, fontSize:14, fontWeight:600, letterSpacing:'0.01em' }}
              onClick={() => setShowAnswer(true)}
            >
              Show Answer →
            </button>
          </div>
        )}

        {/* Answer */}
        {showAnswer && (
          <div className="answer-body" style={{ borderTop:'1px solid var(--border)' }}>
            <div style={{ padding:'18px 24px', background:'var(--surface2)' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:14 }}>
                Answer
              </div>
              <AnswerContent text={q.a} />
            </div>

            {/* Tips section */}
            {hasTips && (
              <div style={{ borderTop:'1px solid var(--border)' }}>
                <button
                  onClick={() => setShowTips(s => !s)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 24px', background:'none', border:'none', cursor:'pointer', color:'var(--amber)',
                    fontSize:13, fontWeight:600,
                  }}
                >
                  <span>💡 Interview Tips ({q.tips.length})</span>
                  <span style={{ fontSize:12, transform: showTips?'rotate(180deg)':'none', transition:'transform 0.2s' }}>▾</span>
                </button>
                {showTips && (
                  <div className="answer-body" style={{ padding:'0 24px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                    {q.tips.map((tip, i) => (
                      <div key={i} className="tip-block">
                        <div className="tip-label">Tip {i+1}</div>
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button
          className={`btn btn-sm${q.reviewed ? '' : ''}`}
          style={q.reviewed ? { borderColor:'var(--green-3)', background:'var(--green-2)', color:'var(--green)' } : {}}
          onClick={handleReviewed}
        >
          {q.reviewed ? '✓ Reviewed' : '○ Mark reviewed'}
        </button>
        <button className="btn btn-sm" onClick={onRegen} disabled={regenLoading}>
          {regenLoading ? <><span className="spinner" style={{width:12,height:12}} /> Generating…</> : '↻ New question'}
        </button>
      </div>

      {/* ── Notes ── */}
      <div className="card" style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>
          📝 My Notes
        </div>
        <textarea
          className="textarea"
          style={{ minHeight:72, fontSize:14 }}
          placeholder="Write your understanding, key points, or memory triggers…"
          value={q.note || ''}
          onChange={e => onSaveNote(e.target.value)}
        />
      </div>
    </div>
  );
}

// ── Main QuestionView ─────────────────────────────────────────────────────────
export default function QuestionView({ topicName, topicData, setQuestions, setIdx, toggleReviewed, saveNote, replaceQuestion }) {
  const [diff,        setDiff]   = useState('medium');
  const [loading,     setLoading]= useState(false);
  const [error,       setError]  = useState('');
  const [regenLoad,   setRegen]  = useState(false);
  const [loadMore,    setLoadMore]= useState(false);
  const bodyRef = useRef(null);

  const diffData  = topicData?.[diff] || { questions:[], idx:0 };
  const questions = diffData.questions || [];
  const idx       = Math.max(0, Math.min(diffData.idx||0, questions.length-1));
  const current   = questions[idx];
  const total     = questions.length;

  const totalReviewed = ['easy','medium','hard'].reduce((a,d) => a+(topicData?.[d]?.questions?.filter(q=>q.reviewed).length||0), 0);
  const totalAll      = ['easy','medium','hard'].reduce((a,d) => a+(topicData?.[d]?.questions?.length||0), 0);
  const pct = totalAll ? Math.round(totalReviewed/totalAll*100) : 0;

  useEffect(() => {
    if (!loading && questions.length === 0) handleGenerate();
    // eslint-disable-next-line
  }, [diff, topicName]);

  // Scroll to top when question changes
  useEffect(() => { bodyRef.current?.scrollTo({ top:0, behavior:'smooth' }); }, [idx, diff]);

  async function handleGenerate() {
    setLoading(true); setError('');
    try {
      const qs = await generateQuestions(topicName, diff);
      await setQuestions(topicName, diff, qs);
    } catch(e) {
      setError(e.message === 'PROXY_URL_MISSING' ? 'Proxy URL not configured. See setup guide.' : e.message);
    } finally { setLoading(false); }
  }

  async function handleLoadMore() {
    setLoadMore(true);
    try {
      const newQs = await generateQuestions(topicName, diff);
      const merged = [...questions, ...newQs];
      await setQuestions(topicName, diff, merged);
    } catch(e) { /* silent */ }
    finally { setLoadMore(false); }
  }

  async function handleRegen() {
    setRegen(true);
    try {
      const q = await regenerateOne(topicName, diff, questions);
      await replaceQuestion(topicName, diff, idx, q);
    } catch(e) { /* silent */ }
    finally { setRegen(false); }
  }

  function handleExport() {
    const lines = [`# ${topicName} — Interview Q&A\n`];
    ['easy','medium','hard'].forEach(d => {
      const qs = topicData?.[d]?.questions;
      if (!qs?.length) return;
      lines.push(`\n## ${DLABEL[d]}\n`);
      qs.forEach((q, i) => {
        lines.push(`\n### Q${i+1}: ${q.q}\n\n${q.a}\n`);
        if (q.tips?.length) { lines.push('\n**Interview Tips:**'); q.tips.forEach(t => lines.push(`- ${t}`)); lines.push(''); }
        if (q.note) lines.push(`\n> **My notes:** ${q.note}\n`);
        lines.push('\n---');
      });
    });
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Copy failed'));
  }

  function goTo(i) { setIdx(topicName, diff, Math.max(0, Math.min(i, total-1))); }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{ padding:'12px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {/* Topic title + progress */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{topicName}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{totalReviewed}/{totalAll} reviewed · {pct}%</div>
          </div>
          <button className="btn btn-sm btn-icon" onClick={handleExport} title="Export all Q&A">⬇</button>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-track" style={{ marginBottom:10 }}>
          <div className="progress-bar-fill" style={{
            width:`${pct}%`,
            background: pct===100 ? 'var(--green)' : pct>50 ? 'var(--accent)' : 'var(--amber)',
          }} />
        </div>

        {/* Difficulty tabs */}
        <div style={{ display:'flex', gap:4 }}>
          {DIFFS.map(d => (
            <button key={d} onClick={() => setDiff(d)} style={{
              flex:1, padding:'7px 4px', borderRadius:8, fontSize:12, fontWeight:600,
              border:`1px solid ${d===diff ? `var(--${d==='easy'?'green':d==='medium'?'amber':'red'}-3)` : 'var(--border)'}`,
              background: d===diff ? `var(--${d==='easy'?'green':d==='medium'?'amber':'red'}-2)` : 'none',
              color: d===diff ? `var(--${d==='easy'?'green':d==='medium'?'amber':'red'})` : 'var(--text-3)',
              cursor:'pointer', transition:'all 0.12s',
            }}>
              {DLABEL[d]}
              {topicData?.[d]?.questions?.length > 0 && (
                <span style={{ fontSize:10, marginLeft:4, opacity:0.7 }}>
                  {topicData[d].questions.filter(q=>q.reviewed).length}/{topicData[d].questions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div ref={bodyRef} style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Loading */}
        {loading && (
          <div className="card animate-fadein" style={{ padding:'32px 24px', textAlign:'center' }}>
            <div className="spinner spinner-lg" style={{ margin:'0 auto 16px' }} />
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Generating questions…</div>
            <div style={{ fontSize:13, color:'var(--text-3)' }}>Creating {DLABEL[diff].toLowerCase()} questions on "{topicName}"</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="card animate-fadein" style={{ padding:'20px 24px', borderColor:'var(--red-3)', background:'var(--red-2)' }}>
            <div style={{ fontSize:14, color:'var(--red)', marginBottom:12 }}>⚠ {error}</div>
            <button className="btn btn-sm" style={{ borderColor:'var(--red-3)', color:'var(--red)' }} onClick={handleGenerate}>↻ Retry</button>
          </div>
        )}

        {/* Question */}
        {!loading && !error && current && (
          <QuestionCard
            key={`${topicName}-${diff}-${idx}`}
            q={current} idx={idx} total={total} diff={diff} topicName={topicName}
            onToggleReviewed={() => toggleReviewed(topicName, diff, idx)}
            onSaveNote={note => saveNote(topicName, diff, idx, note)}
            onRegen={handleRegen}
            regenLoading={regenLoad}
          />
        )}

        {/* Load more */}
        {!loading && total > 0 && (
          <button className="btn btn-full" onClick={handleLoadMore} disabled={loadMore}
            style={{ borderStyle:'dashed', color:'var(--text-3)', marginTop:4 }}
          >
            {loadMore ? <><span className="spinner" style={{width:14,height:14}}/> Generating more…</> : `+ Load more ${DLABEL[diff].toLowerCase()} questions`}
          </button>
        )}

      </div>

      {/* ── Bottom nav ── */}
      {!loading && total > 0 && (
        <div style={{ padding:'10px 16px', background:'var(--surface)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          {/* Scrollable question chips */}
          <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:10, scrollbarWidth:'none', msOverflowStyle:'none' }}>
            {questions.map((q, i) => (
              <button key={i} onClick={() => goTo(i)}
                style={{
                  minWidth:36, height:36, borderRadius:8, border:'1px solid',
                  borderColor: i===idx ? 'var(--accent)' : q.reviewed ? 'var(--green-3)' : 'var(--border)',
                  background:  i===idx ? 'var(--accent)' : q.reviewed ? 'var(--green-2)' : 'var(--surface2)',
                  color:       i===idx ? '#fff' : q.reviewed ? 'var(--green)' : 'var(--text-3)',
                  fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.12s',
                }}
              >{i+1}</button>
            ))}
          </div>

          {/* Prev / Next */}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" style={{ flex:1 }} disabled={idx===0} onClick={() => goTo(idx-1)}>← Prev</button>
            <button className="btn btn-primary" style={{ flex:1 }} disabled={idx===total-1} onClick={() => goTo(idx+1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

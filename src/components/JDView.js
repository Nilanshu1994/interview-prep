import React, { useState } from 'react';

function AnswerContent({ text }) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
          return <pre key={i} className="code-block">{code}</pre>;
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

function JDQuestionCard({ q, idx, total, onReviewed, onNote }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTips,   setShowTips]   = useState(false);

  return (
    <div className="animate-fadein" style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="card" style={{ borderLeft:'4px solid var(--purple)' }}>
        <div style={{ padding:'20px 24px 16px', position:'relative' }}>
          <div style={{ position:'absolute', top:12, right:16, fontSize:52, fontWeight:800, color:'var(--border)', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>
            {String(idx+1).padStart(2,'0')}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span className="badge badge-purple">JD Prep</span>
            <span style={{ fontSize:12, color:'var(--text-3)' }}>{idx+1} of {total}</span>
            {q.reviewed && <span className="badge badge-accent" style={{ fontSize:10 }}>✓ Reviewed</span>}
          </div>
          <div style={{ fontSize:18, fontWeight:700, lineHeight:1.45, color:'var(--text)', marginRight:56 }}>{q.q}</div>
        </div>
        {!showAnswer ? (
          <div style={{ padding:'0 24px 20px' }}>
            <button className="btn btn-primary btn-lg btn-full" style={{ borderRadius:10, background:'var(--purple)', borderColor:'var(--purple)' }} onClick={() => setShowAnswer(true)}>
              Show Answer →
            </button>
          </div>
        ) : (
          <div className="answer-body" style={{ borderTop:'1px solid var(--border)' }}>
            <div style={{ padding:'18px 24px', background:'var(--surface2)' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:14 }}>Answer</div>
              <AnswerContent text={q.a} />
            </div>
            {q.tips?.length > 0 && (
              <div style={{ borderTop:'1px solid var(--border)' }}>
                <button onClick={() => setShowTips(s => !s)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', background:'none', border:'none', cursor:'pointer', color:'var(--amber)', fontSize:13, fontWeight:600 }}>
                  <span>💡 Interview Tips ({q.tips.length})</span>
                  <span style={{ fontSize:12, transform:showTips?'rotate(180deg)':'none', transition:'transform 0.2s' }}>▾</span>
                </button>
                {showTips && (
                  <div className="answer-body" style={{ padding:'0 24px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                    {q.tips.map((tip, i) => (
                      <div key={i} className="tip-block"><div className="tip-label">Tip {i+1}</div>{tip}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-sm" style={q.reviewed ? { borderColor:'var(--green-3)', background:'var(--green-2)', color:'var(--green)' } : {}} onClick={onReviewed}>
          {q.reviewed ? '✓ Reviewed' : '○ Mark reviewed'}
        </button>
      </div>
      <div className="card" style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>📝 My Notes</div>
        <textarea className="textarea" style={{ minHeight:64, fontSize:14 }} placeholder="Key points, your answers…" value={q.note||''} onChange={e => onNote(e.target.value)} />
      </div>
    </div>
  );
}

function JDInput({ onGenerate, loading }) {
  const [jd, setJd] = useState('');
  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:6 }}>📄 JD Prep</div>
        <div style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.6 }}>Paste a job description and get 15 targeted interview questions specific to that role, company, and tech stack.</div>
      </div>
      <div className="card" style={{ padding:'16px' }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>Job Description</div>
        <textarea className="textarea" style={{ minHeight:280, fontSize:14, lineHeight:1.7 }}
          placeholder={"Paste the full job description here — title, responsibilities, tech stack, requirements…\n\nThe more detail you include, the more targeted the questions will be."}
          value={jd} onChange={e => setJd(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-lg btn-full" style={{ borderRadius:10, fontWeight:700, background:'var(--purple)', borderColor:'var(--purple)' }}
        onClick={() => onGenerate(jd)} disabled={loading || jd.trim().length < 50}>
        {loading ? <><span className="spinner" style={{width:16,height:16,borderTopColor:'#fff'}}/> Analyzing &amp; generating…</> : 'Generate Prep Questions →'}
      </button>
      {jd.trim().length > 0 && jd.trim().length < 50 && (
        <div style={{ fontSize:12, color:'var(--text-3)', textAlign:'center' }}>Paste more of the JD for better questions</div>
      )}
    </div>
  );
}

function SessionCard({ session, onOpen, onDelete }) {
  const reviewed = (session.questions||[]).filter(q=>q.reviewed).length;
  const total    = (session.questions||[]).length;
  const d        = new Date(session.created_at);
  const dateStr  = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  return (
    <div className="card" style={{ padding:'16px', cursor:'pointer' }} onClick={onOpen}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{session.title}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            {(session.analysis?.tech_stack||[]).slice(0,5).map((t,i) => (
              <span key={i} className="badge" style={{ fontSize:10, background:'var(--surface2)', color:'var(--text-2)', borderColor:'var(--border)' }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize:12, color:'var(--text-3)' }}>{dateStr} · {reviewed}/{total} reviewed</div>
        </div>
        <button className="btn btn-icon btn-sm" style={{ color:'var(--red)', borderColor:'transparent' }}
          onClick={e => { e.stopPropagation(); onDelete(); }}>🗑</button>
      </div>
      <div className="progress-bar-track" style={{ marginTop:10 }}>
        <div className="progress-bar-fill" style={{ width:total?`${Math.round(reviewed/total*100)}%`:'0%', background:'var(--purple)' }} />
      </div>
    </div>
  );
}

export default function JDView({ jdSessions, createJDSession, deleteJDSession, updateJDQuestion }) {
  const [view,     setView]     = useState('home');
  const [activeId, setActiveId] = useState(null);
  const [qIdx,     setQIdx]     = useState(0);
  const [error,    setError]    = useState('');
  const [analysis, setAnalysis] = useState(null);

  const session   = jdSessions.find(s => s.id === activeId);
  const questions = session?.questions || [];
  const total     = questions.length;

  async function handleGenerate(jdText) {
    if (jdText.trim().length < 50) return;
    setError(''); setView('loading');
    try {
      const sess = await createJDSession(jdText);
      setActiveId(sess.id); setQIdx(0); setAnalysis(sess.analysis); setView('session');
    } catch(e) {
      setError(e.message === 'PROXY_URL_MISSING' ? 'Proxy URL not configured.' : e.message);
      setView('home');
    }
  }

  function openSession(id) {
    setActiveId(id); setQIdx(0);
    setAnalysis(jdSessions.find(s=>s.id===id)?.analysis||null);
    setView('session');
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this JD prep session?')) return;
    await deleteJDSession(id);
    if (activeId===id) setView('home');
  }

  if (view === 'loading') {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
        <div className="spinner spinner-lg" />
        <div style={{ fontSize:16, fontWeight:600, color:'var(--text)' }}>Analyzing JD &amp; generating questions…</div>
        <div style={{ fontSize:13, color:'var(--text-3)', textAlign:'center', maxWidth:320 }}>Extracting tech stack, responsibilities, and role signals — then creating 15 targeted questions.</div>
      </div>
    );
  }

  if (view === 'session' && session) {
    const reviewed = questions.filter(q=>q.reviewed).length;
    const pct      = total ? Math.round(reviewed/total*100) : 0;
    const current  = questions[qIdx];
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <button className="btn btn-icon btn-sm" onClick={() => setView('home')}>←</button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.title}</div>
              <div style={{ fontSize:11, color:'var(--text-3)' }}>{reviewed}/{total} reviewed · {pct}%</div>
            </div>
          </div>
          {analysis && (
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, scrollbarWidth:'none' }}>
              <span className="badge badge-purple">{analysis.level}</span>
              {(analysis.tech_stack||[]).slice(0,6).map((t,i)=>(
                <span key={i} className="badge" style={{ fontSize:10, background:'var(--surface2)', color:'var(--text-2)', borderColor:'var(--border)' }}>{t}</span>
              ))}
            </div>
          )}
          <div className="progress-bar-track" style={{ marginTop:8 }}>
            <div className="progress-bar-fill" style={{ width:`${pct}%`, background:'var(--purple)' }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>
          {current && (
            <JDQuestionCard key={`${session.id}-${qIdx}`} q={current} idx={qIdx} total={total}
              onReviewed={() => updateJDQuestion(session.id, qIdx, { reviewed:!current.reviewed })}
              onNote={note => updateJDQuestion(session.id, qIdx, { note })}
            />
          )}
        </div>
        <div style={{ padding:'10px 16px', background:'var(--surface)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:10, scrollbarWidth:'none' }}>
            {questions.map((q,i) => (
              <button key={i} onClick={() => setQIdx(i)} style={{
                minWidth:36, height:36, borderRadius:8, border:'1px solid',
                borderColor: i===qIdx?'var(--purple)':q.reviewed?'var(--green-3)':'var(--border)',
                background:  i===qIdx?'var(--purple)':q.reviewed?'var(--green-2)':'var(--surface2)',
                color:       i===qIdx?'#fff':q.reviewed?'var(--green)':'var(--text-3)',
                fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0,
              }}>{i+1}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" style={{ flex:1 }} disabled={qIdx===0} onClick={() => setQIdx(i=>Math.max(0,i-1))}>← Prev</button>
            <button className="btn" style={{ flex:1, background:'var(--purple)', color:'#fff', borderColor:'var(--purple)' }} disabled={qIdx===total-1} onClick={() => setQIdx(i=>Math.min(total-1,i+1))}>Next →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      {error && <div style={{ padding:'12px 16px', background:'var(--red-2)', borderBottom:'1px solid var(--red-3)', fontSize:13, color:'var(--red)' }}>⚠ {error}</div>}
      <JDInput onGenerate={handleGenerate} loading={view==='loading'} />
      {jdSessions.length > 0 && (
        <div style={{ padding:'0 16px 24px', maxWidth:640, margin:'0 auto' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:12, paddingTop:4, borderTop:'1px solid var(--border)' }}>Past sessions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {jdSessions.map(s => <SessionCard key={s.id} session={s} onOpen={() => openSession(s.id)} onDelete={() => handleDelete(s.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

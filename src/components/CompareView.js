import React, { useState } from 'react';

function CodeBlock({ code }) {
  return <pre className="code-block">{code}</pre>;
}

function ConceptCard({ concept, topicA, topicB, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ overflow:'hidden' }}>
      <button onClick={() => setOpen(o=>!o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left',
      }}>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{concept.concept}</span>
        <span style={{ fontSize:14, color:'var(--text-3)', transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0 }}>▾</span>
      </button>
      {open && (
        <div className="answer-body" style={{ borderTop:'1px solid var(--border)' }}>
          {/* Two columns — stack on mobile */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:0 }}>
            <div style={{ padding:'14px 18px', borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
              <div className="badge badge-accent" style={{ marginBottom:10, fontSize:10 }}>{topicA}</div>
              <p style={{ fontSize:13, lineHeight:1.7, color:'var(--text-2)', marginBottom:8 }}>{concept.topic_a?.explanation}</p>
              {concept.topic_a?.code && <CodeBlock code={concept.topic_a.code} />}
            </div>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
              <div className="badge badge-purple" style={{ marginBottom:10, fontSize:10 }}>{topicB}</div>
              <p style={{ fontSize:13, lineHeight:1.7, color:'var(--text-2)', marginBottom:8 }}>{concept.topic_b?.explanation}</p>
              {concept.topic_b?.code && <CodeBlock code={concept.topic_b.code} />}
            </div>
          </div>
          {concept.difference && (
            <div style={{ padding:'12px 18px', background:'var(--amber-2)', display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>⚡</span>
              <span style={{ fontSize:13, color:'var(--amber)', lineHeight:1.65 }}>
                <strong>Key difference:</strong> {concept.difference}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompareView({ topics, getComparison, runComparison, deleteComparison }) {
  const topicNames = Object.keys(topics);
  const [topicA,   setTopicA]  = useState('');
  const [topicB,   setTopicB]  = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [result,   setResult]  = useState(null);

  const selectStyle = {
    padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
    background:'var(--bg)', color:'var(--text)', fontSize:14, outline:'none',
    cursor:'pointer', flex:1, minWidth:0, minHeight:44, fontFamily:'var(--font)',
  };

  async function handleCompare() {
    if (!topicA || !topicB) { setError('Select two topics.'); return; }
    if (topicA === topicB)  { setError('Pick two different topics.'); return; }
    setError(''); setLoading(true); setResult(null);
    const cached = getComparison(topicA, topicB);
    if (cached) { setResult({ topicA, topicB, data:cached }); setLoading(false); return; }
    try {
      const data = await runComparison(topicA, topicB);
      setResult({ topicA, topicB, data });
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleRegen() {
    if (!result) return;
    await deleteComparison(result.topicA, result.topicB);
    setResult(null); setLoading(true);
    try {
      const data = await runComparison(result.topicA, result.topicB);
      setResult({ topicA:result.topicA, topicB:result.topicB, data });
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function handleExport() {
    if (!result) return;
    const { topicA:a, topicB:b, data:d } = result;
    const lines = [`# ${a} vs ${b}\n\n${d.summary}\n`];
    (d.shared_concepts||[]).forEach(c => {
      lines.push(`\n## ${c.concept}`);
      lines.push(`\n**${a}:** ${c.topic_a?.explanation}\n\`\`\`\n${c.topic_a?.code}\n\`\`\``);
      lines.push(`\n**${b}:** ${c.topic_b?.explanation}\n\`\`\`\n${c.topic_b?.code}\n\`\`\``);
      lines.push(`\n⚡ ${c.difference}\n`);
    });
    lines.push(`\n## Only in ${a}`);
    (d.only_in_a||[]).forEach(i => lines.push(`- ${i}`));
    lines.push(`\n## Only in ${b}`);
    (d.only_in_b||[]).forEach(i => lines.push(`- ${i}`));
    lines.push(`\n## When to use ${a}\n${d.when_to_use_a}`);
    lines.push(`\n## When to use ${b}\n${d.when_to_use_b}`);
    navigator.clipboard.writeText(lines.join('\n'))
      .then(()  => alert('Copied to clipboard!'))
      .catch(() => alert('Copy failed'));
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* Top bar */}
      <div style={{ padding:'14px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:12 }}>⚖ Compare Topics</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <select value={topicA} onChange={e=>setTopicA(e.target.value)} style={selectStyle}>
            <option value="">Topic A…</option>
            {topicNames.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontSize:13, color:'var(--text-3)', flexShrink:0, fontWeight:600 }}>vs</span>
          <select value={topicB} onChange={e=>setTopicB(e.target.value)} style={selectStyle}>
            <option value="">Topic B…</option>
            {topicNames.map(t=><option key={t} value={t} disabled={t===topicA}>{t}</option>)}
          </select>
          <button className="btn btn-primary" style={{ flexShrink:0, minHeight:44 }}
            onClick={handleCompare} disabled={loading||!topicA||!topicB}>
            {loading ? <><span className="spinner" style={{width:14,height:14,borderTopColor:'#fff'}}/> Generating…</> : 'Compare →'}
          </button>
          {result && <>
            <button className="btn btn-sm" onClick={handleRegen} disabled={loading}>↻ Regenerate</button>
            <button className="btn btn-sm" onClick={handleExport}>⬇ Export</button>
          </>}
        </div>
        {error && <div style={{ marginTop:8, fontSize:12, color:'var(--red)' }}>⚠ {error}</div>}
        {topicA && topicB && topicA!==topicB && getComparison(topicA,topicB) && !result && (
          <div style={{ marginTop:8, fontSize:11, color:'var(--green)' }}>✓ Cached — will load instantly</div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>

        {topicNames.length < 2 && (
          <div className="card animate-fadein" style={{ padding:'32px 24px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:0.3 }}>⚖</div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Add at least 2 topics</div>
            <div style={{ fontSize:13, color:'var(--text-3)' }}>Go to Topics and add two to compare them side by side.</div>
          </div>
        )}

        {loading && (
          <div className="card animate-fadein" style={{ padding:'32px 24px', textAlign:'center' }}>
            <div className="spinner spinner-lg" style={{ margin:'0 auto 16px' }} />
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Generating comparison…</div>
            <div style={{ fontSize:13, color:'var(--text-3)' }}>This may take ~15 seconds — creating side-by-side code examples for each concept.</div>
          </div>
        )}

        {!loading && result && (() => {
          const { topicA:a, topicB:b, data:d } = result;
          return (
            <>
              {/* Summary */}
              <div className="card animate-fadein" style={{ padding:'18px 20px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:10 }}>Overview</div>
                <p style={{ fontSize:14, lineHeight:1.75, color:'var(--text-2)' }}>{d.summary}</p>
              </div>

              {/* Shared concepts */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:10 }}>
                  Shared concepts — side by side
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {(d.shared_concepts||[]).map((c,i) => (
                    <ConceptCard key={i} concept={c} topicA={a} topicB={b} defaultOpen={i===0} />
                  ))}
                </div>
              </div>

              {/* Unique features — stacked on mobile */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:10 }}>Unique features</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                  {[['only_in_a', a, 'accent'], ['only_in_b', b, 'purple']].map(([key, name, col]) => (
                    <div key={key} className="card" style={{ padding:'16px' }}>
                      <div className={`badge badge-${col}`} style={{ marginBottom:12, fontSize:10 }}>Only in {name}</div>
                      <ul style={{ paddingLeft:16, margin:0, display:'flex', flexDirection:'column', gap:5 }}>
                        {(d[key]||[]).map((item,i) => (
                          <li key={i} style={{ fontSize:13, lineHeight:1.65, color:'var(--text-2)' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* When to use — stacked on mobile */}
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:10 }}>When to use each</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                  {[['when_to_use_a', a, 'accent'], ['when_to_use_b', b, 'purple']].map(([key, name, col]) => (
                    <div key={key} className="card" style={{ padding:'16px' }}>
                      <div className={`badge badge-${col}`} style={{ marginBottom:10, fontSize:10 }}>Use {name} when…</div>
                      <p style={{ fontSize:13, lineHeight:1.7, color:'var(--text-2)' }}>{d[key]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

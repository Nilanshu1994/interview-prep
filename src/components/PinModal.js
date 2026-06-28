import React, { useState, useEffect, useRef } from 'react';

const CORRECT_PIN = process.env.REACT_APP_ADMIN_PIN || '';
export function checkPin(pin) { return CORRECT_PIN && pin === CORRECT_PIN; }

export default function PinModal({ onSuccess, onClose }) {
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  function handleSubmit() {
    if (!pin) return;
    if (checkPin(pin)) {
      sessionStorage.setItem('admin_unlocked', '1');
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setShake(true); setPin('');
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:200, padding:20, backdropFilter:'blur(4px)',
    }}>
      <div onClick={e=>e.stopPropagation()} className={shake?'pin-shake':''} style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:16, padding:'28px 24px 24px',
        width:'100%', maxWidth:320,
        boxShadow:'var(--shadow-lg)',
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🔒</div>
          <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Admin access</div>
          <div style={{ fontSize:13, color:'var(--text-3)', lineHeight:1.5 }}>Enter your PIN to add or delete topics</div>
        </div>
        <input
          ref={inputRef}
          type="password" inputMode="numeric" maxLength={8}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g,'')); setError(''); }}
          onKeyDown={e => e.key==='Enter' && handleSubmit()}
          placeholder="• • • •"
          style={{
            width:'100%', padding:'13px 14px', textAlign:'center',
            fontSize:24, letterSpacing:'0.4em',
            border:`1.5px solid ${error?'var(--red)':'var(--border)'}`,
            borderRadius:10, background:'var(--bg)', color:'var(--text)',
            outline:'none', marginBottom:8, fontFamily:'monospace',
            minHeight:54,
          }}
        />
        {error && <div style={{ fontSize:12, color:'var(--red)', textAlign:'center', marginBottom:10 }}>{error}</div>}
        <button className="btn btn-primary btn-full btn-lg" style={{ borderRadius:10, marginBottom:8 }} onClick={handleSubmit}>Unlock</button>
        <button className="btn btn-full" style={{ borderRadius:10 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

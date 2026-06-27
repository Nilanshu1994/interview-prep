import React, { useState, useEffect, useRef } from 'react';

// PIN is baked in at build time from .env — never visible in UI
const CORRECT_PIN = process.env.REACT_APP_ADMIN_PIN || '';

export function checkPin(pin) {
  return CORRECT_PIN && pin === CORRECT_PIN;
}

export default function PinModal({ onSuccess, onClose }) {
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [shake, setShake]   = useState(false);
  const inputRef            = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit() {
    if (!pin) return;
    if (checkPin(pin)) {
      // Store in sessionStorage — cleared when tab closes
      sessionStorage.setItem('admin_unlocked', '1');
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        .pin-shake { animation: shake 0.5s ease; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
          padding:'20px',
        }}
      >
        {/* Modal box — stop click propagation so overlay click closes but box click doesn't */}
        <div
          onClick={e => e.stopPropagation()}
          className={shake ? 'pin-shake' : ''}
          style={{
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'14px', padding:'28px 28px 24px',
            width:'100%', maxWidth:'320px',
            boxShadow:'0 20px 60px rgba(0,0,0,0.18)',
          }}
        >
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{ fontSize:'32px', marginBottom:'10px' }}>🔒</div>
            <div style={{ fontSize:'16px', fontWeight:600, color:'var(--text)', marginBottom:'4px' }}>
              Admin access
            </div>
            <div style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:'1.5' }}>
              Enter your PIN to add or delete topics
            </div>
          </div>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g,'')); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter PIN"
            style={{
              width:'100%', padding:'11px 14px', textAlign:'center',
              fontSize:'22px', letterSpacing:'0.3em',
              border:`1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius:'9px', background:'var(--bg)', color:'var(--text)',
              outline:'none', marginBottom:'8px', fontFamily:'monospace',
            }}
          />

          {error && (
            <div style={{
              fontSize:'12px', color:'var(--danger)', textAlign:'center', marginBottom:'10px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            style={{
              width:'100%', padding:'10px', background:'var(--accent)', color:'#fff',
              border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:500,
              cursor:'pointer', marginBottom:'8px',
            }}
          >
            Unlock
          </button>
          <button
            onClick={onClose}
            style={{
              width:'100%', padding:'8px', background:'none', color:'var(--text-muted)',
              border:'1px solid var(--border)', borderRadius:'9px',
              fontSize:'13px', cursor:'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react';
import { Flag, Mail, Lock } from 'lucide-react';
import { C } from '../theme.js';
import BigButton from './BigButton.jsx';
import { signUp, signIn, sendPasswordReset } from '../lib/auth.js';

const inputWrap = { display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.line}`, background: C.card, borderRadius: 12, padding: '12px 14px', marginBottom: 10 };
const inputStyle = { border: 'none', background: 'transparent', width: '100%', fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.ink, outline: 'none' };

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) setError(error);
        else setMessage('Account created — check your email to confirm, then log in.');
      } else if (mode === 'reset') {
        const { error } = await sendPasswordReset(email);
        if (error) setError(error);
        else setMessage('Password reset email sent.');
      } else {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px', width: '100%' }}>
        <div style={{ textAlign: 'center', margin: '18px 0 30px' }}>
          <Flag size={40} color={C.pine} style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: 0.5 }}>BUCKHORN SPRINGS</div>
          <div style={{ fontSize: 14, color: C.inkSoft, fontWeight: 600, letterSpacing: 1 }}>SHOT JOURNAL</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={inputWrap}>
            <Mail size={16} color={C.inkSoft} />
            <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {mode !== 'reset' && (
            <div style={inputWrap}>
              <Lock size={16} color={C.inkSoft} />
              <input
                style={inputStyle}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          {error && <div style={{ background: C.missBg, color: C.miss, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          {message && <div style={{ background: C.hitBg, color: C.hit, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 10 }}>{message}</div>}

          <BigButton disabled={busy} style={{ marginBottom: 12 }}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Email' : 'Log In'}
          </BigButton>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13 }}>
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: C.pine, fontWeight: 700 }}>
                Create an account
              </button>
              <span style={{ color: C.inkSoft }}> · </span>
              <button type="button" onClick={() => setMode('reset')} style={{ background: 'none', border: 'none', color: C.inkSoft, fontWeight: 600 }}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: C.pine, fontWeight: 700 }}>
              Back to log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

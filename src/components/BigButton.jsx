import React from 'react';
import { C } from '../theme.js';

export default function BigButton({ children, onClick, tone = 'pine', style, disabled }) {
  const tones = {
    pine: { bg: C.pine, fg: '#fff' },
    ghost: { bg: '#fff', fg: C.pine, border: `2px solid ${C.pine}` },
    danger: { bg: '#fff', fg: C.miss, border: `2px solid ${C.miss}` },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: t.bg, color: t.fg, border: t.border || 'none',
        borderRadius: 16, padding: '18px 20px', fontSize: 18, fontWeight: 700,
        fontFamily: 'Inter, sans-serif', width: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        opacity: disabled ? 0.5 : 1, boxShadow: tone === 'pine' ? '0 4px 14px rgba(31,75,63,0.25)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}


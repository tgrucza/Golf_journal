import React from 'react';
import { C } from '../theme.js';

export default function TogglePill({ active, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!active)}
      style={{
        width: '100%', padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 700,
        fontFamily: 'Inter, sans-serif', border: `2px solid ${C.neutral}`,
        background: active ? C.neutral : '#fff', color: active ? '#fff' : C.neutral,
        marginBottom: 8,
      }}
    >
      {active ? '✓ ' : ''}{label}
    </button>
  );
}


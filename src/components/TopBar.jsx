import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { C } from '../theme.js';

export default function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.pine, fontWeight: 700, background: 'none', border: 'none', fontSize: 13 }}>
        <ChevronLeft size={17} /> Back
      </button>
      <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: C.ink }}>{title}</div>
      <div style={{ width: 40 }}>{right}</div>
    </div>
  );
}


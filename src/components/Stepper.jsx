import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { C } from '../theme.js';

export default function Stepper({ value, onChange, min = 0, max = 12, label, size = 44 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0, border: `2px solid ${C.pine}`, background: '#fff', color: C.pine, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      ><Minus size={size * 0.45} /></button>
      <div style={{ minWidth: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 26, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{value}</div>
        {label && <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 1 }}>{label}</div>}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0, border: `2px solid ${C.pine}`, background: C.pine, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      ><Plus size={size * 0.45} /></button>
    </div>
  );
}


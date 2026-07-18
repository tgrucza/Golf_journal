import React from 'react';
import { TROUBLE_OPTIONS } from '../theme.js';

export default function TroubleRow({ value, onChange, options = TROUBLE_OPTIONS }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
      {options.map(opt => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(selected ? null : opt.key)}
            style={{
              flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              fontFamily: 'Inter, sans-serif', border: `1.5px dashed ${opt.color}`,
              background: selected ? opt.color : '#fff',
              color: selected ? '#fff' : opt.color,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}


import React from 'react';

export default function OptionGrid({ options, value, onChange, columns = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
      {options.map(opt => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding: '9px 6px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              fontFamily: 'Inter, sans-serif', border: `2px solid ${opt.color}`,
              background: selected ? opt.color : '#fff',
              color: selected ? '#fff' : opt.color,
              minHeight: 34, transition: 'all .12s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}


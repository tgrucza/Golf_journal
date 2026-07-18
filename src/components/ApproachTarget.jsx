import React from 'react';

function TargetCell({ opt, value, onChange, area }) {
  const selected = value === opt.key;
  return (
    <button
      onClick={() => onChange(opt.key)}
      style={{
        gridArea: area, padding: '9px 4px', borderRadius: 10, fontSize: 11.5, fontWeight: 700,
        fontFamily: 'Inter, sans-serif', border: `2px solid ${opt.color}`,
        background: selected ? opt.color : '#fff',
        color: selected ? '#fff' : opt.color,
        minHeight: 34, transition: 'all .12s ease',
      }}
    >
      {opt.label}
    </button>
  );
}

export default function ApproachTarget({ options, value, onChange }) {
  const byKey = k => options.find(o => o.key === k);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateAreas: `". long ." "left green right" ". short ."`,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto auto',
        gap: 6,
      }}
    >
      <TargetCell opt={byKey('long')} value={value} onChange={onChange} area="long" />
      <TargetCell opt={byKey('left')} value={value} onChange={onChange} area="left" />
      <TargetCell opt={byKey('green')} value={value} onChange={onChange} area="green" />
      <TargetCell opt={byKey('right')} value={value} onChange={onChange} area="right" />
      <TargetCell opt={byKey('short')} value={value} onChange={onChange} area="short" />
    </div>
  );
}


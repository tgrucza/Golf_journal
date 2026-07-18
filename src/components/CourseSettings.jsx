import React, { useState } from 'react';
import { C } from '../theme.js';
import TopBar from './TopBar.jsx';
import BigButton from './BigButton.jsx';

export default function CourseSettings({ holesConfig, onSave, onBack }) {
  const [local, setLocal] = useState(holesConfig);
  const setPar = (num, delta) => {
    setLocal(prev => prev.map(h => h.number === num ? { ...h, par: Math.min(5, Math.max(3, h.par + delta)) } : h));
  };
  const total = local.reduce((s, h) => s + h.par, 0);
  return (
    <div>
      <TopBar title="Course Setup" onBack={onBack} />
      <p style={{ fontSize: 14, color: C.inkSoft, marginBottom: 16 }}>
        Par is pulled from the official Buckhorn Springs scorecard (Black tees). Adjust here only if you play different tees. Total par: <b style={{ color: C.ink }}>{total}</b>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {local.map(h => (
          <div key={h.number} style={{ background: C.card, borderRadius: 14, padding: 12, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: C.ink }}>Hole {h.number}</div>
              <div style={{ fontSize: 11, color: C.inkSoft }}>{h.yards} yds · Hcp {h.handicap}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPar(h.number, -1)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.pine}`, background: '#fff', color: C.pine }}>−</button>
              <div style={{ width: 22, textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontSize: 20 }}>{h.par}</div>
              <button onClick={() => setPar(h.number, 1)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.pine}`, background: '#fff', color: C.pine }}>+</button>
            </div>
          </div>
        ))}
      </div>
      <BigButton onClick={() => onSave(local)}>Save Course</BigButton>
    </div>
  );
}

import React, { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { C, SECTION_TITLE_STYLE } from '../theme.js';
import TopBar from './TopBar.jsx';

export default function CourseEditor({ holesConfig, onSave, onBack }) {
  const [local, setLocal] = useState(holesConfig);
  const [saved, setSaved] = useState(false);

  const setPar = (num, par) => {
    setLocal(prev => prev.map(h => (h.number === num ? { ...h, par } : h)));
  };
  const setField = (num, field, value) => {
    setLocal(prev => prev.map(h => (h.number === num ? { ...h, [field]: value } : h)));
  };

  const total = local.reduce((s, h) => s + (Number(h.par) || 0), 0);

  const handicapCounts = {};
  local.forEach(h => {
    const v = Number(h.handicap);
    handicapCounts[v] = (handicapCounts[v] || 0) + 1;
  });
  const hasDuplicateHandicap = num => (handicapCounts[Number(num)] || 0) > 1;
  const anyDuplicates = Object.values(handicapCounts).some(c => c > 1);

  function handleSave() {
    onSave(
      local.map(h => ({
        ...h,
        par: Number(h.par),
        yards: Number(h.yards),
        handicap: Number(h.handicap),
      }))
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <TopBar title="Course Editor" onBack={onBack} />

      <div
        style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div>
          <div style={SECTION_TITLE_STYLE}>Buckhorn Springs · Black Tees</div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>18 holes · edit par, yardage & handicap</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 30, fontWeight: 600, color: C.navy }}>{total}</div>
          <div style={{ fontSize: 10, color: C.inkSoft, fontWeight: 700, letterSpacing: 0.5 }}>TOTAL PAR</div>
        </div>
      </div>

      {anyDuplicates && (
        <div style={{ background: C.missBg, borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertCircle size={16} color={C.miss} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: C.ink }}>
            <b>Duplicate handicap index</b> — each hole needs a unique 1–18 value.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {local.map(h => {
          const dup = hasDuplicateHandicap(h.handicap);
          return (
            <div key={h.number} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 15, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>
                  Hole {h.number}
                </div>
                <div style={{ fontSize: 10, color: C.inkSoft, whiteSpace: 'nowrap' }}>Par {h.par}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 8 }}>
                {[3, 4, 5].map(p => {
                  const selected = Number(h.par) === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPar(h.number, p)}
                      style={{
                        padding: '6px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                        border: `1.5px solid ${C.navy}`,
                        background: selected ? C.navy : '#fff',
                        color: selected ? '#fff' : C.navy,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9.5, color: C.inkSoft, textTransform: 'uppercase', marginBottom: 3 }}>Yardage</div>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.line}`, background: C.bg, borderRadius: 9, padding: '5px 8px' }}>
                  <input
                    type="number"
                    value={h.yards}
                    onChange={e => setField(h.number, 'yards', e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: C.ink, outline: 'none' }}
                  />
                  <span style={{ fontSize: 11, color: C.inkSoft, whiteSpace: 'nowrap' }}>yds</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9.5, color: C.inkSoft, textTransform: 'uppercase', marginBottom: 3 }}>Handicap</div>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', borderRadius: 9, padding: '5px 8px',
                    border: `1px solid ${dup ? C.miss : C.line}`,
                    background: dup ? C.missBg : C.bg,
                  }}
                >
                  <input
                    type="number"
                    value={h.handicap}
                    onChange={e => setField(h.number, 'handicap', e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: dup ? C.miss : C.ink, outline: 'none' }}
                  />
                  <span style={{ fontSize: 11, color: dup ? C.miss : C.inkSoft, whiteSpace: 'nowrap' }}>/ 18</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', background: C.navy, color: '#fff', border: 'none', borderRadius: 16,
          padding: '18px 20px', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: `0 4px 14px ${C.navyShadow}`,
        }}
      >
        {saved ? (
          <><Check size={20} /> Saved</>
        ) : (
          'Save Course'
        )}
      </button>
    </div>
  );
}

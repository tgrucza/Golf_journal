import React from 'react';
import { C } from '../theme.js';
import { toParStr } from '../lib/format.js';

function scoreColor(score, par) {
  if (score == null) return C.inkSoft;
  if (score < par) return C.hit;
  if (score > par) return C.miss;
  return C.ink;
}

function NineGrid({ nineLabel, holes, holeData, currentHole }) {
  const gridStyle = { display: 'grid', gridTemplateColumns: '30px repeat(9, 1fr) 32px', alignItems: 'center' };
  const labelStyle = { fontSize: 9, fontWeight: 700, color: C.inkSoft };
  const rowBorder = { borderTop: `1px solid ${C.line}`, padding: '6px 0' };

  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  const scores = holes.map(h => (holeData[h.number] ? holeData[h.number].score : null));
  const playedCount = scores.filter(s => s != null).length;
  const totalScore = scores.reduce((s, v) => s + (v || 0), 0);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '10px 8px', marginBottom: 12 }}>
      <div style={gridStyle}>
        <div style={labelStyle}>HOLE</div>
        {holes.map(h => (
          <div key={h.number} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: h.number === currentHole ? C.navy : C.ink }}>
            {h.number}
          </div>
        ))}
        <div style={{ ...labelStyle, textAlign: 'center' }}>{nineLabel}</div>
      </div>

      <div style={{ ...gridStyle, ...rowBorder }}>
        <div style={labelStyle}>PAR</div>
        {holes.map(h => (
          <div key={h.number} style={{ textAlign: 'center', fontSize: 11, color: C.inkSoft }}>{h.par}</div>
        ))}
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.ink }}>{totalPar}</div>
      </div>

      <div style={{ ...gridStyle, ...rowBorder }}>
        <div style={labelStyle}>YDS</div>
        {holes.map(h => (
          <div key={h.number} style={{ textAlign: 'center', fontSize: 10, color: C.inkSoft }}>{h.yards}</div>
        ))}
        <div />
      </div>

      <div style={{ ...gridStyle, ...rowBorder }}>
        <div style={labelStyle}>HCP</div>
        {holes.map(h => (
          <div key={h.number} style={{ textAlign: 'center', fontSize: 10, color: C.inkSoft }}>{h.handicap}</div>
        ))}
        <div style={{ textAlign: 'center', fontSize: 10, color: C.inkSoft }}>–</div>
      </div>

      <div style={{ ...gridStyle, ...rowBorder }}>
        <div style={labelStyle}>SCORE</div>
        {holes.map(h => {
          const score = holeData[h.number] ? holeData[h.number].score : null;
          const isCurrent = h.number === currentHole;
          return (
            <div key={h.number} style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Oswald, sans-serif', fontSize: 13, fontWeight: 700,
                  background: isCurrent ? C.navy : 'transparent',
                  color: isCurrent ? '#fff' : scoreColor(score, h.par),
                }}
              >
                {score != null ? score : isCurrent ? '·' : '–'}
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontSize: 13, fontWeight: 700, color: C.ink }}>
          {playedCount ? totalScore : '–'}
        </div>
      </div>
    </div>
  );
}

export default function Scorecard({ holesConfig, holes, currentHole }) {
  const front = holesConfig.slice(0, 9);
  const back = holesConfig.slice(9, 18);
  const holeData = holes || {};

  const playedHoles = holesConfig.filter(h => holeData[h.number] && holeData[h.number].score != null);
  const totalScore = playedHoles.reduce((s, h) => s + holeData[h.number].score, 0);
  const totalPar = playedHoles.reduce((s, h) => s + h.par, 0);
  const thru = playedHoles.length;

  return (
    <div>
      <NineGrid nineLabel="OUT" holes={front} holeData={holeData} currentHole={currentHole} />
      <NineGrid nineLabel="IN" holes={back} holeData={holeData} currentHole={currentHole} />
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: C.inkSoft, textTransform: 'uppercase' }}>THRU {thru}</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>Live total · updates as you play</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 30, fontWeight: 600, color: C.navy }}>{thru ? totalScore : '–'}</div>
          {thru > 0 && <div style={{ fontSize: 12, color: C.inkSoft }}>{toParStr(totalScore - totalPar)}</div>}
        </div>
      </div>
    </div>
  );
}

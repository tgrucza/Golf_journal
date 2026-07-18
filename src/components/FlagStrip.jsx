import React from 'react';
import { C } from '../theme.js';

// ---------- Flag progress strip ----------
export default function FlagStrip({ holesConfig, completedMap, currentHole, onJump }) {
  return (
    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '2px 2px 8px' }}>
      {holesConfig.map(h => {
        const done = !!completedMap[h.number];
        const active = h.number === currentHole;
        return (
          <button
            key={h.number}
            onClick={() => onJump(h.number)}
            style={{
              flex: '0 0 auto', width: 26, height: 26, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? C.pine : done ? C.hitBg : '#fff',
              border: `1.5px solid ${active ? C.pine : done ? C.hit : C.line}`,
              color: active ? '#fff' : done ? C.hit : C.inkSoft,
              fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif',
            }}
          >
            {h.number}
          </button>
        );
      })}
    </div>
  );
}


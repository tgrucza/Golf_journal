import React, { useState } from 'react';
import { Flag, Play, BarChart3, Settings, MoreHorizontal } from 'lucide-react';
import { C } from '../theme.js';
import BigButton from './BigButton.jsx';

export default function Home({ activeRound, currentHole, roundsCount, onStart, onResume, onAbandon, onFinishNow, onStats, onSettings }) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // null | 'finish' | 'discard'
  const holesLogged = activeRound ? Object.keys(activeRound.holes || {}).length : 0;

  const linkStyle = { width: '100%', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, padding: '6px 0' };

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '18px 0 30px' }}>
        <Flag size={40} color={C.pine} style={{ marginBottom: 8 }} />
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: 0.5 }}>BUCKHORN SPRINGS</div>
        <div style={{ fontSize: 14, color: C.inkSoft, fontWeight: 600, letterSpacing: 1 }}>SHOT JOURNAL</div>
      </div>

      {activeRound && (
        <div style={{ marginBottom: 16 }}>
          <BigButton onClick={onResume}><Play size={20} /> Resume Round — Hole {currentHole}</BigButton>

          {!showMenu ? (
            <button onClick={() => setShowMenu(true)} style={{ ...linkStyle, color: C.inkSoft, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <MoreHorizontal size={15} /> Round options
            </button>
          ) : (
            <div style={{ marginTop: 8, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 10 }}>

              {confirmAction === 'finish' ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <button onClick={onFinishNow} style={{ flex: 1, background: C.pine, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '9px', borderRadius: 9 }}>
                    Yes, finish now
                  </button>
                  <button onClick={() => setConfirmAction(null)} style={{ flex: 1, background: '#fff', border: `1.5px solid ${C.line}`, color: C.inkSoft, fontSize: 12.5, fontWeight: 700, padding: '9px', borderRadius: 9 }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => holesLogged > 0 && setConfirmAction('finish')}
                  disabled={holesLogged === 0}
                  style={{ ...linkStyle, color: holesLogged > 0 ? C.pine : C.line, textAlign: 'left' }}
                >
                  Finish Round Now {holesLogged > 0 ? `(${holesLogged} hole${holesLogged === 1 ? '' : 's'} logged)` : '(log at least 1 hole first)'}
                </button>
              )}

              {confirmAction === 'discard' ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={onAbandon} style={{ flex: 1, background: C.miss, border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '9px', borderRadius: 9 }}>
                    Yes, discard it
                  </button>
                  <button onClick={() => setConfirmAction(null)} style={{ flex: 1, background: '#fff', border: `1.5px solid ${C.line}`, color: C.inkSoft, fontSize: 12.5, fontWeight: 700, padding: '9px', borderRadius: 9 }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmAction('discard')} style={{ ...linkStyle, color: C.miss, textAlign: 'left' }}>
                  Discard This Round
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!activeRound && (
        <div style={{ marginBottom: 16 }}>
          <BigButton onClick={onStart}><Play size={20} /> Start New Round</BigButton>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <BigButton onClick={onStats} tone="ghost"><BarChart3 size={20} /> Journal & Stats ({roundsCount})</BigButton>
      </div>

      <button onClick={onSettings} style={{ width: '100%', background: 'none', border: 'none', color: C.inkSoft, fontSize: 14, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600 }}>
        <Settings size={16} /> Edit Course Pars
      </button>
    </div>
  );
}

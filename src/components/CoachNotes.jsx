import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { C } from '../theme.js';
import TopBar from './TopBar.jsx';
import BigButton from './BigButton.jsx';
import { buildCsvRows, rowsToCsvString } from '../lib/csvExport.js';

export default function CoachNotes({ roundsIndex, holesConfig, onBack }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    setStatus('loading');
    setError(null);
    try {
      const rows = await buildCsvRows(roundsIndex, holesConfig);
      const csv = rowsToCsvString(rows);
      const resp = await fetch('/api/coach-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Something went wrong');
      setNotes(data.analysis);
      setStatus('done');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  return (
    <div>
      <TopBar title="Coach's Notes" onBack={onBack} />

      {status === 'idle' && (
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <Sparkles size={32} color={C.pine} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 20 }}>
            Send your {roundsIndex.length} logged round{roundsIndex.length === 1 ? '' : 's'} to an AI coach for a quick read on what to
            practice.
          </p>
          <BigButton onClick={handleAnalyze} disabled={roundsIndex.length === 0}>
            <Sparkles size={18} /> Analyze My Rounds
          </BigButton>
        </div>
      )}

      {status === 'loading' && <div style={{ textAlign: 'center', padding: '40px 10px', color: C.inkSoft, fontSize: 14 }}>Reading your rounds…</div>}

      {status === 'error' && (
        <div style={{ background: C.missBg, color: C.miss, borderRadius: 12, padding: 14, fontSize: 13.5, marginBottom: 14 }}>{error}</div>
      )}

      {status === 'done' && (
        <>
          <div
            style={{
              background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 14,
              fontSize: 14, lineHeight: 1.55, color: C.ink, whiteSpace: 'pre-wrap',
            }}
          >
            {notes}
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            style={{
              width: '100%', background: 'none', border: `2px solid ${C.navy}`, color: C.navy, borderRadius: 16,
              padding: '12px 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <RefreshCw size={15} /> Re-run Analysis
          </button>
        </>
      )}
    </div>
  );
}

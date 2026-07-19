import React, { useState } from 'react';
import { Download, Clipboard, Check } from 'lucide-react';
import { C, SECTION_TITLE_STYLE } from '../theme.js';
import TopBar from './TopBar.jsx';
import Section from './Section.jsx';
import { buildCsvRows, rowsToCsvString, downloadCsv, AI_PROMPT } from '../lib/csvExport.js';

export default function ExportData({ roundsIndex, holesConfig, onBack }) {
  const [downloadState, setDownloadState] = useState('idle'); // idle | done
  const [copyState, setCopyState] = useState('idle');

  async function handleExportCsv() {
    const rows = await buildCsvRows(roundsIndex, holesConfig);
    downloadCsv(rowsToCsvString(rows));
    setDownloadState('done');
    setTimeout(() => setDownloadState('idle'), 1600);
  }

  async function handleCopyForAi() {
    const rows = await buildCsvRows(roundsIndex, holesConfig);
    const csv = rowsToCsvString(rows);
    const text = `${AI_PROMPT}\n\n${csv}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('clipboard write failed', e);
    }
    setCopyState('done');
    setTimeout(() => setCopyState('idle'), 1600);
  }

  return (
    <div>
      <TopBar title="Export Data" onBack={onBack} />

      <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 6 }}>
        Export your round history as a spreadsheet, or copy it ready-made for pasting into an AI model for coaching.
      </p>
      <div style={{ ...SECTION_TITLE_STYLE, marginBottom: 16 }}>
        {roundsIndex.length} round{roundsIndex.length === 1 ? '' : 's'} logged
      </div>

      <button
        onClick={handleExportCsv}
        style={{
          width: '100%', background: C.navy, color: '#fff', border: 'none', borderRadius: 16,
          padding: '16px 20px', fontSize: 16, fontWeight: 700, fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: `0 4px 14px ${C.navyShadow}`, marginBottom: 10,
        }}
      >
        {downloadState === 'done' ? (
          <><Check size={19} /> Downloaded</>
        ) : (
          <><Download size={19} /> Export CSV</>
        )}
      </button>

      <button
        onClick={handleCopyForAi}
        style={{
          width: '100%', background: '#fff', color: C.navy, border: `2px solid ${C.navy}`, borderRadius: 16,
          padding: '16px 20px', fontSize: 16, fontWeight: 700, fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8,
        }}
      >
        {copyState === 'done' ? (
          <><Check size={19} /> Copied to Clipboard</>
        ) : (
          <><Clipboard size={19} /> Copy for AI Analysis</>
        )}
      </button>
      <p style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 24 }}>
        Copies every round as CSV, with a ready-made coaching prompt pasted in front — just paste the result into ChatGPT, Claude, or any AI model.
      </p>

      <Section title="Sample CSV Row">
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 10, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontFamily: 'ui-monospace, monospace', fontSize: 10.5, whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                {['hole', 'par', 'score', 'fairway', 'approach', 'putts', 'penalty'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '3px 8px', color: C.inkSoft, background: C.bg, fontWeight: 600 }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['7', '4', '5', 'left', 'green', '2', 'tee:water'].map((v, i) => (
                  <td key={i} style={{ padding: '3px 8px', color: C.ink }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Prompt Preview">
        <div style={{ background: C.hitBg, borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: C.ink, fontStyle: 'italic' }}>
          "{AI_PROMPT}"
        </div>
      </Section>
    </div>
  );
}

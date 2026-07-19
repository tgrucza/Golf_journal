import { storageGet } from './storage.js';

export const CSV_HEADER = ['hole', 'par', 'score', 'fairway', 'approach', 'putts', 'penalty'];

export const AI_PROMPT = "Here's my Buckhorn Springs round data as CSV. Identify my 3 biggest scoring leaks and one drill to fix each.";

function penaltyField(h) {
  const parts = [];
  if (h.teeTrouble) parts.push(`tee:${h.teeTrouble}`);
  if (h.approachTrouble) parts.push(`approach:${h.approachTrouble}`);
  return parts.join(';');
}

export async function buildCsvRows(roundsIndex, holesConfig) {
  const rounds = (await Promise.all(roundsIndex.map(r => storageGet('round-' + r.id)))).filter(Boolean);
  rounds.sort((a, b) => new Date(a.date) - new Date(b.date));

  const rows = [CSV_HEADER];
  rounds.forEach(round => {
    Object.keys(round.holes || {})
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(num => {
        const h = round.holes[num];
        const cfg = holesConfig.find(c => c.number === num);
        rows.push([
          num,
          cfg ? cfg.par : '',
          h.score ?? '',
          h.teeShot ?? '',
          h.approach ?? '',
          h.putts ?? '',
          penaltyField(h),
        ]);
      });
  });
  return rows;
}

export function rowsToCsvString(rows) {
  return rows
    .map(row =>
      row
        .map(cell => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadCsv(csvString, filename = 'buckhorn-rounds.csv') {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

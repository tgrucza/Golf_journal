
export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
export function toParStr(n) {
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}
export function roundPar(round, holesConfig) {
  return Object.keys((round && round.holes) || {}).reduce((sum, num) => {
    const cfg = holesConfig.find(h => String(h.number) === String(num));
    return sum + (cfg ? cfg.par : 0);
  }, 0);
}


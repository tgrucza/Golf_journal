import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Loader2, Trash2 } from 'lucide-react';
import { C } from '../theme.js';
import { fmtDate, toParStr, roundPar } from '../lib/format.js';
import { storageGet } from '../lib/storage.js';
import { aggregateHoleStats } from '../lib/stats.js';
import TopBar from './TopBar.jsx';
import Section from './Section.jsx';

export default function StatsView({ roundsIndex, holesConfig, onBack, onDeleteRound }) {
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [allRounds, setAllRounds] = useState([]);

  useEffect(() => { load(); }, [roundsIndex]);
  async function load() {
    setLoading(true);
    const details = await Promise.all(roundsIndex.map(r => storageGet('round-' + r.id)));
    setAllRounds(details.filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date)));
    setLoading(false);
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" color={C.pine} size={30} /></div>;
  }
  if (allRounds.length === 0) {
    return (
      <div>
        <TopBar title="Journal & Stats" onBack={onBack} />
        <p style={{ color: C.inkSoft, marginTop: 20 }}>No completed rounds yet. Finish a round and it'll show up here.</p>
      </div>
    );
  }

  const scoreTrend = allRounds.map(r => {
    const holesArr = Object.values(r.holes || {});
    const score = holesArr.reduce((s, h) => s + (h.score || 0), 0);
    return { name: fmtDate(r.date), toPar: score - roundPar(r, holesConfig), score };
  });
  const fgTrend = allRounds.map(r => {
    const holesArr = Object.values(r.holes || {});
    const teeHoles = holesArr.filter(h => h.teeShot);
    const fwHit = teeHoles.filter(h => h.teeShot === 'fairway').length;
    const girHit = holesArr.filter(h => h.approach === 'green').length;
    return {
      name: fmtDate(r.date),
      fairwayPct: teeHoles.length ? Math.round((fwHit / teeHoles.length) * 100) : 0,
      girPct: holesArr.length ? Math.round((girHit / holesArr.length) * 100) : 0,
    };
  });
  const puttsTrend = allRounds.map(r => {
    const holesArr = Object.values(r.holes || {});
    const putts = holesArr.reduce((s, h) => s + (h.putts || 0), 0);
    return { name: fmtDate(r.date), putts };
  });
  const penaltyTrend = allRounds.map(r => {
    const holesArr = Object.values(r.holes || {});
    const penalties = holesArr.filter(h => h.teeTrouble === 'water' || h.teeTrouble === 'ob').length
      + holesArr.filter(h => h.approachTrouble === 'water' || h.approachTrouble === 'ob').length;
    return { name: fmtDate(r.date), penalties };
  });

  let scrambleOpps = 0, scrambleMade = 0;
  let ssOpps = 0, ssMade = 0, nonSsOpps = 0, nonSsMade = 0;
  let threePutts = 0, puttsLogged = 0;
  let sandOpps = 0, sandMade = 0;
  let highMiss = 0, lowMiss = 0;
  allRounds.forEach(r => {
    Object.entries(r.holes || {}).forEach(([num, h]) => {
      const holeCfg = holesConfig.find(c => String(c.number) === String(num));
      if (!holeCfg) return;
      if (h.putts != null && h.score != null) {
        puttsLogged += 1;
        if (h.putts >= 3) threePutts += 1;
      }
      if (h.firstPuttBreak === 'high') highMiss += 1;
      else if (h.firstPuttBreak === 'low') lowMiss += 1;
      if (h.score == null || !h.approach || h.approach === 'green') return;
      scrambleOpps += 1;
      const saved = h.score <= holeCfg.par;
      if (saved) scrambleMade += 1;
      if (h.shortSided) { ssOpps += 1; if (saved) ssMade += 1; }
      else { nonSsOpps += 1; if (saved) nonSsMade += 1; }
      if (h.approachTrouble === 'bunker') { sandOpps += 1; if (saved) sandMade += 1; }
    });
  });
  const scramblePct = scrambleOpps ? Math.round((scrambleMade / scrambleOpps) * 100) : null;
  const threePuttPct = puttsLogged ? Math.round((threePutts / puttsLogged) * 100) : null;
  const sandSavePct = sandOpps ? Math.round((sandMade / sandOpps) * 100) : null;
  const ssScramblePct = ssOpps ? Math.round((ssMade / ssOpps) * 100) : null;
  const nonSsScramblePct = nonSsOpps ? Math.round((nonSsMade / nonSsOpps) * 100) : null;
  const totalBreakMisses = highMiss + lowMiss;
  let breakInsight = null;
  if (totalBreakMisses >= 3) {
    if (highMiss > lowMiss * 1.5) breakInsight = `You miss high side ${highMiss} times vs low side ${lowMiss} — likely over-reading the break.`;
    else if (lowMiss > highMiss * 1.5) breakInsight = `You miss low side ${lowMiss} times vs high side ${highMiss} — likely under-reading the break.`;
    else breakInsight = `High side ${highMiss} · Low side ${lowMiss} — no strong read pattern yet.`;
  }

  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const avgToPar = avg(scoreTrend.map(s => s.toPar));
  const avgFw = avg(fgTrend.map(s => s.fairwayPct));
  const avgGir = avg(fgTrend.map(s => s.girPct));
  const avgPutts = avg(puttsTrend.map(s => s.putts));
  const avgPenalties = avg(penaltyTrend.map(s => s.penalties));

  const holeStats = aggregateHoleStats(allRounds, holesConfig).sort((a, b) => a.number - b.number);
  const troubleHoles = [...holeStats].filter(h => h.rounds > 0).sort((a, b) => b.avgToPar - a.avgToPar).slice(0, 3);

  return (
    <div>
      <TopBar title="Journal & Stats" onBack={onBack} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
        <StatCard label="Rounds Logged" value={allRounds.length} />
        <StatCard label="Avg Score" value={toParStr(Math.round(avgToPar * 10) / 10)} />
        <StatCard label="Avg Putts" value={avgPutts.toFixed(1)} />
        <StatCard label="Avg Fairways" value={`${Math.round(avgFw)}%`} />
        <StatCard label="Avg GIR" value={`${Math.round(avgGir)}%`} />
        <StatCard label="Scrambling" value={scramblePct != null ? `${scramblePct}%` : '—'} />
        <StatCard label="3-Putt Rate" value={threePuttPct != null ? `${threePuttPct}%` : '—'} />
        <StatCard label="Sand Save %" value={sandSavePct != null ? `${sandSavePct}%` : '—'} />
        <StatCard label="Avg Penalties" value={avgPenalties.toFixed(1)} />
      </div>

      {(ssScramblePct != null || nonSsScramblePct != null) && (
        <div style={{ background: C.neutralBg, borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12.5, color: C.ink }}>
          <b>Short-sided misses</b> save par {ssScramblePct != null ? `${ssScramblePct}%` : '—'} of the time, vs {nonSsScramblePct != null ? `${nonSsScramblePct}%` : '—'} when you've got green to work with.
        </div>
      )}

      {breakInsight && (
        <div style={{ background: C.neutralBg, borderRadius: 12, padding: '10px 14px', marginBottom: 24, fontSize: 12.5, color: C.ink }}>
          <b>Putt break read:</b> {breakInsight}
        </div>
      )}

      <Section title="Penalties per Round (Water + O.B.)">
        <ChartCard>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={penaltyTrend}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.inkSoft }} />
              <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="penalties" fill={C.water} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      <Section title="Score vs Par by Round">
        <ChartCard>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={scoreTrend}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.inkSoft }} />
              <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} />
              <Tooltip formatter={(v, n) => n === 'toPar' ? toParStr(v) : v} />
              <Line type="monotone" dataKey="toPar" stroke={C.pine} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      <Section title="Fairways Hit % & GIR % by Round">
        <ChartCard>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={fgTrend}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.inkSoft }} />
              <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} />
              <Tooltip />
              <Bar dataKey="fairwayPct" name="Fairways %" fill={C.hit} radius={[6, 6, 0, 0]} />
              <Bar dataKey="girPct" name="GIR %" fill={C.neutral} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      <Section title="Putts per Round">
        <ChartCard>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={puttsTrend}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.inkSoft }} />
              <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} />
              <Tooltip />
              <Line type="monotone" dataKey="putts" stroke={C.neutral} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <div style={{ textAlign: 'center', fontSize: 13, color: C.inkSoft, marginTop: 6 }}>Average: {avgPutts.toFixed(1)} putts/round</div>
      </Section>

      <Section title="Trouble Holes (avg score vs par)">
        <ChartCard>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={holeStats}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="number" tick={{ fontSize: 10, fill: C.inkSoft }} />
              <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} />
              <Tooltip formatter={(v) => toParStr(Math.round(v * 10) / 10)} labelFormatter={(l) => 'Hole ' + l} />
              <Bar dataKey="avgToPar" radius={[6, 6, 0, 0]}>
                {holeStats.map((h, i) => (
                  <Cell key={i} fill={h.avgToPar > 0.4 ? C.miss : h.avgToPar < -0.1 ? C.hit : C.neutral} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {troubleHoles.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {troubleHoles.map(h => (
              <div key={h.number} style={{ background: C.missBg, borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>
                  Hole {h.number} (Par {h.par}) — averaging {toParStr(Math.round(h.avgToPar * 10) / 10)}
                </div>
                {h.dominantMiss && (
                  <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>
                    Pattern: {h.dominantMiss.label} ({h.dominantMiss.count}x)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Round History">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...allRounds].reverse().map(r => {
            const holesArr = Object.values(r.holes || {});
            const score = holesArr.reduce((s, h) => s + (h.score || 0), 0);
            const putts = holesArr.reduce((s, h) => s + (h.putts || 0), 0);
            return (
              <div key={r.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{fmtDate(r.date)}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>{holesArr.length} holes · {putts} putts</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, color: C.pine }}>{score} ({toParStr(score - roundPar(r, holesConfig))})</div>
                  {pendingDeleteId === r.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { onDeleteRound(r.id); setPendingDeleteId(null); }} style={{ background: C.miss, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 8px', borderRadius: 8 }}>Delete</button>
                      <button onClick={() => setPendingDeleteId(null)} style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.inkSoft, fontSize: 11, fontWeight: 700, padding: '6px 8px', borderRadius: 8 }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setPendingDeleteId(r.id)} style={{ background: 'none', border: 'none', color: C.miss }}><Trash2 size={18} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 26, color: C.pine, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.inkSoft, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}
function ChartCard({ children }) {
  return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '12px 8px' }}>{children}</div>;
}

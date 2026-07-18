import React, { useState, useEffect } from 'react';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { C, SECTION_TITLE_STYLE, TEE_OPTIONS, APPROACH_OPTIONS, SHORT_GAME_OPTIONS, FIRST_PUTT_OPTIONS, BREAK_OPTIONS } from '../theme.js';
import { toParStr } from '../lib/format.js';
import { calcAutoScore } from '../lib/stats.js';
import Section from './Section.jsx';
import OptionGrid from './OptionGrid.jsx';
import TroubleRow from './TroubleRow.jsx';
import ApproachTarget from './ApproachTarget.jsx';
import TogglePill from './TogglePill.jsx';
import Stepper from './Stepper.jsx';
import BigButton from './BigButton.jsx';

export default function HoleEntry({ hole, initialData, onSaveAndGo, holesTotal }) {
  const isPar3 = hole.par === 3;
  const blank = { teeShot: null, teeTrouble: null, approach: null, approachTrouble: null, shortSided: false, shortGame: null, putts: 0, firstPutt: null, firstPuttBreak: null, score: hole.par };
  const [data, setData] = useState(initialData || blank);
  const [scoreTouched, setScoreTouched] = useState(!!initialData);

  useEffect(() => { setData(initialData || blank); setScoreTouched(!!initialData); }, [hole.number]);

  useEffect(() => {
    setData(prev => {
      if (prev.putts === 1 && (prev.firstPutt !== 'holed' || prev.firstPuttBreak !== null)) return { ...prev, firstPutt: 'holed', firstPuttBreak: null };
      if (prev.putts >= 2 && prev.firstPutt === 'holed') return { ...prev, firstPutt: null };
      if (prev.putts === 0 && (prev.firstPutt !== null || prev.firstPuttBreak !== null)) return { ...prev, firstPutt: null, firstPuttBreak: null };
      return prev;
    });
  }, [data.putts]);

  // Holing the chip/pitch means no putt was needed.
  useEffect(() => {
    if (data.shortGame === 'holed' && data.putts !== 0) {
      setData(prev => ({ ...prev, putts: 0 }));
    }
  }, [data.shortGame]);

  // Auto-suggest the score from the shots logged, until the person manually adjusts it.
  useEffect(() => {
    if (scoreTouched) return;
    const suggested = calcAutoScore(data, hole.par);
    if (suggested !== data.score) setData(prev => ({ ...prev, score: suggested }));
  }, [data.approach, data.putts, data.shortGame, data.teeTrouble, data.approachTrouble, scoreTouched]);

  const missedGreen = data.approach && data.approach !== 'green';
  const set = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 24, fontWeight: 600, color: C.ink }}>Hole {hole.number}</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft, fontWeight: 600 }}>Par {hole.par} · {hole.yards} yds · Hcp {hole.handicap}</div>
        </div>
        <Flag size={20} color={C.pine} />
      </div>

      {!isPar3 && (
        <Section title="Off the Tee">
          <OptionGrid options={TEE_OPTIONS} value={data.teeShot} onChange={v => set('teeShot', v)} />
          <TroubleRow value={data.teeTrouble} onChange={v => set('teeTrouble', v)} />
        </Section>
      )}

      <Section title={isPar3 ? 'Off the Tee' : 'Approach Shot'}>
        <ApproachTarget options={APPROACH_OPTIONS} value={data.approach} onChange={v => set('approach', v)} />
        <TroubleRow value={data.approachTrouble} onChange={v => set('approachTrouble', v)} />
      </Section>

      {missedGreen && (
        <Section title="Chip / Pitch">
          <TogglePill active={data.shortSided} onChange={v => set('shortSided', v)} label="Short-Sided" />
          <OptionGrid options={SHORT_GAME_OPTIONS} value={data.shortGame} onChange={v => set('shortGame', v)} columns={2} />
        </Section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <div>
          <div style={SECTION_TITLE_STYLE}>Putts</div>
          {data.shortGame === 'holed' ? (
            <div style={{ background: C.hitBg, borderRadius: 10, padding: '11px 6px', color: C.hit, fontWeight: 700, fontSize: 12, textAlign: 'center' }}>
              Chip-in ⛳<br />0 putts
            </div>
          ) : (
            <Stepper value={data.putts} onChange={v => set('putts', v)} min={0} max={8} />
          )}
        </div>
        <div>
          <div style={SECTION_TITLE_STYLE}>Score</div>
          <Stepper value={data.score} onChange={v => { set('score', v); setScoreTouched(true); }} min={1} max={12} label={toParStr(data.score - hole.par) + ' vs par'} />
        </div>
      </div>

      {data.putts === 1 && (
        <div style={{ background: C.hitBg, borderRadius: 10, padding: '7px', color: C.hit, fontWeight: 700, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
          One putt — holed ⛳
        </div>
      )}

      {data.putts >= 2 && (
        <Section title="First Putt Finished">
          <OptionGrid options={FIRST_PUTT_OPTIONS.filter(o => o.key !== 'holed')} value={data.firstPutt} onChange={v => set('firstPutt', v)} columns={2} />
          <TroubleRow options={BREAK_OPTIONS} value={data.firstPuttBreak} onChange={v => set('firstPuttBreak', v)} />
        </Section>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {hole.number > 1 && (
          <button
            onClick={() => onSaveAndGo(data, hole.number - 1)}
            style={{ width: 50, borderRadius: 12, border: `2px solid ${C.pine}`, background: '#fff', color: C.pine, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          ><ChevronLeft size={22} /></button>
        )}
        <BigButton onClick={() => onSaveAndGo(data, hole.number < holesTotal ? hole.number + 1 : 'finish')} style={{ padding: '13px 16px', fontSize: 15 }}>
          {hole.number < holesTotal ? <>Save & Next Hole <ChevronRight size={18} /></> : 'Finish Round'}
        </BigButton>
      </div>
    </div>
  );
}

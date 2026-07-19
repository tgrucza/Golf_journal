import React, { useState, useEffect, useRef } from 'react';
import { Flag, ChevronLeft, ChevronRight, Pencil, LayoutGrid } from 'lucide-react';
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
import Scorecard from './Scorecard.jsx';

function useSkipFirst(value, onChange) {
  const skip = useRef(true);
  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    if (value == null) return;
    onChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

function ModeToggle({ mode, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4, marginBottom: 16 }}>
      <button
        onClick={() => onChange('entry')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px', borderRadius: 12, border: `2px solid ${C.navy}`, fontSize: 13, fontWeight: 700,
          background: mode === 'entry' ? C.navy : '#fff', color: mode === 'entry' ? '#fff' : C.navy,
        }}
      >
        <Pencil size={14} /> Hole Entry
      </button>
      <button
        onClick={() => onChange('scorecard')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px', borderRadius: 12, border: `2px solid ${C.navy}`, fontSize: 13, fontWeight: 700,
          background: mode === 'scorecard' ? C.navy : '#fff', color: mode === 'scorecard' ? '#fff' : C.navy,
        }}
      >
        <LayoutGrid size={14} /> Scorecard
      </button>
    </div>
  );
}

export default function HoleEntry({ hole, initialData, onSaveAndGo, holesTotal, courseHoles, roundHoles }) {
  const isPar3 = hole.par === 3;
  const blank = { teeShot: null, teeTrouble: null, approach: null, approachTrouble: null, shortSided: false, shortGame: null, putts: 0, firstPutt: null, firstPuttBreak: null, score: hole.par };
  const [data, setData] = useState(initialData || blank);
  const [scoreTouched, setScoreTouched] = useState(!!initialData);
  const [mode, setMode] = useState('entry');

  const containerRef = useRef(null);
  const approachRef = useRef(null);
  const chipRef = useRef(null);
  const puttsRef = useRef(null);
  const breakRef = useRef(null);

  useEffect(() => { setData(initialData || blank); setScoreTouched(!!initialData); setMode('entry'); }, [hole.number]);

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

  function scrollToRef(ref) {
    if (!ref?.current || !containerRef.current) return;
    const top = ref.current.offsetTop - 8;
    containerRef.current.scrollTo({ top, behavior: 'smooth' });
  }

  // Auto-scroll to the next relevant section as the golfer taps through.
  useSkipFirst(data.teeShot ?? data.teeTrouble, () => scrollToRef(approachRef));
  useSkipFirst(data.approach, () => scrollToRef(missedGreen ? chipRef : puttsRef));
  useSkipFirst(data.approachTrouble, () => scrollToRef(chipRef));
  useSkipFirst(data.shortGame, () => scrollToRef(puttsRef));
  useSkipFirst(data.firstPutt, () => scrollToRef(breakRef));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 16px' }}>
        {mode === 'scorecard' ? (
          <>
            <ModeToggle mode={mode} onChange={setMode} />
            <Scorecard holesConfig={courseHoles} holes={roundHoles} currentHole={hole.number} />
          </>
        ) : (
          <>
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
                {data.teeShot && data.teeShot !== 'fairway' && (
                  <TroubleRow value={data.teeTrouble} onChange={v => set('teeTrouble', v)} />
                )}
              </Section>
            )}

            <div ref={approachRef}>
              <Section title={isPar3 ? 'Off the Tee' : 'Approach Shot'}>
                <ApproachTarget options={APPROACH_OPTIONS} value={data.approach} onChange={v => set('approach', v)} />
                {missedGreen && (
                  <TroubleRow value={data.approachTrouble} onChange={v => set('approachTrouble', v)} />
                )}
              </Section>
            </div>

            {missedGreen && (
              <div ref={chipRef}>
                <Section title="Chip / Pitch">
                  <TogglePill active={data.shortSided} onChange={v => set('shortSided', v)} label="Short-Sided" />
                  <OptionGrid options={SHORT_GAME_OPTIONS} value={data.shortGame} onChange={v => set('shortGame', v)} columns={2} />
                </Section>
              </div>
            )}

            <div ref={puttsRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
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
              <div ref={breakRef}>
                <Section title="First Putt Finished">
                  <OptionGrid options={FIRST_PUTT_OPTIONS.filter(o => o.key !== 'holed')} value={data.firstPutt} onChange={v => set('firstPutt', v)} columns={2} />
                  <TroubleRow options={BREAK_OPTIONS} value={data.firstPuttBreak} onChange={v => set('firstPuttBreak', v)} />
                </Section>
              </div>
            )}

            <ModeToggle mode={mode} onChange={setMode} />
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '10px 14px', borderTop: `1px solid ${C.line}`, background: C.bg }}>
        {mode === 'scorecard' ? (
          <BigButton onClick={() => setMode('entry')} style={{ padding: '13px 16px', fontSize: 15, background: C.navy, boxShadow: `0 4px 14px ${C.navyShadow}` }}>
            <Pencil size={16} /> Back to Hole Entry
          </BigButton>
        ) : (
          <>
            {hole.number > 1 && (
              <button
                onClick={() => onSaveAndGo(data, hole.number - 1)}
                style={{ width: 50, borderRadius: 12, border: `2px solid ${C.pine}`, background: '#fff', color: C.pine, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <BigButton onClick={() => onSaveAndGo(data, hole.number < holesTotal ? hole.number + 1 : 'finish')} style={{ padding: '13px 16px', fontSize: 15 }}>
              {hole.number < holesTotal ? <>Save & Next Hole <ChevronRight size={18} /></> : 'Finish Round'}
            </BigButton>
          </>
        )}
      </div>
    </div>
  );
}

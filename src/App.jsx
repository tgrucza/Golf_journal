import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { C } from './theme.js';
import { HOLES_DATA } from './data/course.js';
import { storageGet, storageSet, storageDelete, uid } from './lib/storage.js';
import { roundPar } from './lib/format.js';
import Home from './components/Home.jsx';
import TopBar from './components/TopBar.jsx';
import FlagStrip from './components/FlagStrip.jsx';
import HoleEntry from './components/HoleEntry.jsx';
import CourseSettings from './components/CourseSettings.jsx';
import StatsView from './components/StatsView.jsx';

export default function App() {
  const [view, setView] = useState('loading');
  const [holesConfig, setHolesConfig] = useState(null);
  const [roundsIndex, setRoundsIndex] = useState([]);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [currentHole, setCurrentHole] = useState(1);

  useEffect(() => { init(); }, []);

  async function init() {
    let cfg = await storageGet('course-holes-v2');
    if (!cfg) {
      cfg = HOLES_DATA;
      await storageSet('course-holes-v2', cfg);
    }
    setHolesConfig(cfg);
    let idx = await storageGet('rounds-index');
    if (!idx) idx = [];
    setRoundsIndex(idx);
    let activeId = await storageGet('active-round-id');
    if (activeId) {
      const r = await storageGet('round-' + activeId);
      if (r) {
        setActiveRoundId(activeId);
        setActiveRound(r);
        let resumeHole = 1;
        for (let h = 1; h <= cfg.length; h++) { if (r.holes[h]) resumeHole = Math.min(h + 1, cfg.length); }
        setCurrentHole(resumeHole);
      } else {
        await storageDelete('active-round-id');
      }
    }
    setView('home');
  }

  async function startNewRound() {
    const id = uid();
    const round = { id, date: new Date().toISOString(), holes: {} };
    await storageSet('round-' + id, round);
    await storageSet('active-round-id', id);
    setActiveRoundId(id);
    setActiveRound(round);
    setCurrentHole(1);
    setView('play');
  }

  async function abandonActiveRound() {
    if (!activeRoundId) return;
    await storageDelete('round-' + activeRoundId);
    await storageDelete('active-round-id');
    setActiveRoundId(null);
    setActiveRound(null);
    setView('home');
  }

  const handleSaveAndGo = useCallback(async (holeNumber, data, dest) => {
    const updated = { ...activeRound, holes: { ...activeRound.holes, [holeNumber]: data } };
    setActiveRound(updated);
    await storageSet('round-' + activeRoundId, updated);
    if (dest === 'finish') {
      await finishRound(updated);
    } else {
      setCurrentHole(dest);
    }
  }, [activeRound, activeRoundId, holesConfig, roundsIndex]);

  async function finishRound(round) {
    const totalPar = roundPar(round, holesConfig);
    const holesArr = Object.values(round.holes);
    const totalScore = holesArr.reduce((s, h) => s + (h.score || 0), 0);
    const summary = { id: round.id, date: round.date, totalScore, totalPar, holesPlayed: holesArr.length };
    const newIndex = [...roundsIndex.filter(r => r.id !== round.id), summary];
    setRoundsIndex(newIndex);
    await storageSet('rounds-index', newIndex);
    await storageDelete('active-round-id');
    setActiveRoundId(null);
    setActiveRound(null);
    setView('home');
  }

  async function finishNow() {
    if (!activeRound) return;
    await finishRound(activeRound);
  }

  async function handleDeleteRound(id) {
    const newIndex = roundsIndex.filter(r => r.id !== id);
    setRoundsIndex(newIndex);
    await storageSet('rounds-index', newIndex);
    await storageDelete('round-' + id);
  }

  async function handleSaveCourse(newConfig) {
    setHolesConfig(newConfig);
    await storageSet('course-holes-v2', newConfig);
    setView('home');
  }

  if (view === 'loading' || !holesConfig) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={C.pine} size={32} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 14px 24px' }}>

        {view === 'home' && (
          <Home
            activeRound={activeRound}
            currentHole={currentHole}
            roundsCount={roundsIndex.length}
            onStart={startNewRound}
            onResume={() => setView('play')}
            onAbandon={abandonActiveRound}
            onFinishNow={finishNow}
            onStats={() => setView('stats')}
            onSettings={() => setView('settings')}
          />
        )}

        {view === 'play' && activeRound && (
          <div>
            <TopBar title={`Hole ${currentHole} of ${holesConfig.length}`} onBack={() => setView('home')} />
            <FlagStrip
              holesConfig={holesConfig}
              completedMap={activeRound.holes}
              currentHole={currentHole}
              onJump={(n) => setCurrentHole(n)}
            />
            <HoleEntry
              key={currentHole}
              hole={holesConfig[currentHole - 1]}
              initialData={activeRound.holes[currentHole]}
              holesTotal={holesConfig.length}
              onSaveAndGo={(data, dest) => handleSaveAndGo(currentHole, data, dest)}
            />
          </div>
        )}

        {view === 'settings' && (
          <CourseSettings holesConfig={holesConfig} onSave={handleSaveCourse} onBack={() => setView('home')} />
        )}

        {view === 'stats' && (
          <StatsView roundsIndex={roundsIndex} holesConfig={holesConfig} onBack={() => setView('home')} onDeleteRound={handleDeleteRound} />
        )}
      </div>
    </div>
  );
}

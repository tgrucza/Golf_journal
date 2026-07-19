import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { C } from './theme.js';
import { HOLES_DATA } from './data/course.js';
import { storageGet, storageSet, storageDelete, uid } from './lib/storage.js';
import { roundPar } from './lib/format.js';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import { getSession, onAuthStateChange, signOut } from './lib/auth.js';
import { fetchOrCreateCourse, courseRowToHolesConfig, saveCourseHoles } from './lib/courseSync.js';
import { queueRoundSync, flushSyncQueue, mergeServerRounds, deleteRoundRemote } from './lib/sync.js';
import ConfigMissing from './components/ConfigMissing.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Onboarding from './components/Onboarding.jsx';
import MigrationPrompt from './components/MigrationPrompt.jsx';
import Home from './components/Home.jsx';
import TopBar from './components/TopBar.jsx';
import FlagStrip from './components/FlagStrip.jsx';
import HoleEntry from './components/HoleEntry.jsx';
import CourseEditor from './components/CourseEditor.jsx';
import StatsView from './components/StatsView.jsx';
import ExportData from './components/ExportData.jsx';
import CoachNotes from './components/CoachNotes.jsx';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" color={C.pine} size={32} />
    </div>
  );
}

export default function App() {
  // ---------- account / auth state ----------
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [course, setCourse] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [localRoundsCount, setLocalRoundsCount] = useState(0);

  // ---------- existing app state ----------
  const [view, setView] = useState('loading');
  const [holesConfig, setHolesConfig] = useState(null);
  const [roundsIndex, setRoundsIndex] = useState([]);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [currentHole, setCurrentHole] = useState(1);

  // ---------- bootstrap auth session ----------
  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    let subscription;
    (async () => {
      const s = await getSession();
      setSession(s);
      setAuthLoading(false);
      const { data } = onAuthStateChange(newSession => setSession(newSession));
      subscription = data.subscription;
    })();
    return () => subscription?.unsubscribe();
  }, []);

  // ---------- once we have a session, load account, course, and rounds ----------
  useEffect(() => {
    if (!session) {
      setProfile(null);
      setCourse(null);
      setNeedsOnboarding(false);
      setNeedsMigration(false);
      setView('loading');
      return;
    }
    bootstrapAccount(session.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function bootstrapAccount(userId) {
    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(profileRow);

    const courseRow = await fetchOrCreateCourse(userId);
    setCourse(courseRow);
    const cfg = courseRow ? courseRowToHolesConfig(courseRow) : HOLES_DATA;
    setHolesConfig(cfg);
    await storageSet('course-holes-v2', cfg);

    if (!profileRow?.display_name) {
      setNeedsOnboarding(true);
      return;
    }
    await checkMigrationThenLoadRounds(userId, cfg, courseRow?.id);
  }

  async function checkMigrationThenLoadRounds(userId, cfg, courseId) {
    const handledKey = 'migration-handled:' + userId;
    const handled = await storageGet(handledKey);
    const idx = (await storageGet('rounds-index')) || [];
    if (!handled && idx.length > 0) {
      setLocalRoundsCount(idx.length);
      setNeedsMigration(true);
      return;
    }
    await finishBootstrap(userId, cfg, courseId);
  }

  async function finishBootstrap(userId, cfg, courseId) {
    const merged = await mergeServerRounds(userId);
    const idx = merged || (await storageGet('rounds-index')) || [];
    setRoundsIndex(idx);

    let activeId = await storageGet('active-round-id');
    if (activeId) {
      const r = await storageGet('round-' + activeId);
      if (r) {
        setActiveRoundId(activeId);
        setActiveRound(r);
        let resumeHole = 1;
        for (let h = 1; h <= cfg.length; h++) {
          if (r.holes[h]) resumeHole = Math.min(h + 1, cfg.length);
        }
        setCurrentHole(resumeHole);
      } else {
        await storageDelete('active-round-id');
      }
    }
    setView('home');
  }

  async function handleOnboardingDone(name) {
    setProfile(prev => ({ ...(prev || {}), display_name: name }));
    setNeedsOnboarding(false);
    await checkMigrationThenLoadRounds(session.user.id, holesConfig, course?.id);
  }

  async function handleMigrationDone() {
    await storageSet('migration-handled:' + session.user.id, true);
    setNeedsMigration(false);
    await finishBootstrap(session.user.id, holesConfig, course?.id);
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
  }

  // Retry any queued syncs when the app regains focus or comes back online.
  useEffect(() => {
    if (!session?.user?.id) return;
    const retry = () => flushSyncQueue(session.user.id, holesConfig, course?.id);
    window.addEventListener('focus', retry);
    window.addEventListener('online', retry);
    return () => {
      window.removeEventListener('focus', retry);
      window.removeEventListener('online', retry);
    };
  }, [session, holesConfig, course]);

  // ---------- round-play flow (existing logic, now sync-aware) ----------

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

  const handleSaveAndGo = useCallback(
    async (holeNumber, data, dest) => {
      const updated = { ...activeRound, holes: { ...activeRound.holes, [holeNumber]: data } };
      setActiveRound(updated);
      await storageSet('round-' + activeRoundId, updated);
      if (session?.user?.id) {
        queueRoundSync(activeRoundId).then(() => flushSyncQueue(session.user.id, holesConfig, course?.id));
      }
      if (dest === 'finish') {
        await finishRound(updated);
      } else {
        setCurrentHole(dest);
      }
    },
    [activeRound, activeRoundId, holesConfig, roundsIndex, session, course]
  );

  async function finishRound(round) {
    const totalPar = roundPar(round, holesConfig);
    const holesArr = Object.values(round.holes);
    const totalScore = holesArr.reduce((s, h) => s + (h.score || 0), 0);
    const finished = { ...round, finished: true };
    await storageSet('round-' + round.id, finished);
    const summary = { id: round.id, date: round.date, totalScore, totalPar, holesPlayed: holesArr.length };
    const newIndex = [...roundsIndex.filter(r => r.id !== round.id), summary];
    setRoundsIndex(newIndex);
    await storageSet('rounds-index', newIndex);
    await storageDelete('active-round-id');
    setActiveRoundId(null);
    setActiveRound(null);
    setView('home');
    if (session?.user?.id) {
      queueRoundSync(round.id).then(() => flushSyncQueue(session.user.id, holesConfig, course?.id));
    }
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
    if (session?.user?.id) {
      deleteRoundRemote(session.user.id, id);
    }
  }

  async function handleSaveCourse(newConfig) {
    setHolesConfig(newConfig);
    await storageSet('course-holes-v2', newConfig);
    if (course?.id) {
      saveCourseHoles(course.id, newConfig);
    }
    setView('home');
  }

  // ---------- render ----------

  if (!supabaseConfigured) return <ConfigMissing />;
  if (authLoading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (needsOnboarding) return <Onboarding userId={session.user.id} course={course} onDone={handleOnboardingDone} />;
  if (needsMigration) {
    return (
      <MigrationPrompt
        userId={session.user.id}
        holesConfig={holesConfig}
        courseId={course?.id}
        localRoundsCount={localRoundsCount}
        onDone={handleMigrationDone}
      />
    );
  }

  if (view === 'loading' || !holesConfig) return <LoadingScreen />;

  if (view === 'play' && activeRound) {
    return (
      <div style={{ height: '100dvh', background: C.bg, fontFamily: 'Inter, sans-serif', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flexShrink: 0, padding: '12px 14px 0' }}>
            <TopBar title={`Hole ${currentHole} of ${holesConfig.length}`} onBack={() => setView('home')} />
            <FlagStrip
              holesConfig={holesConfig}
              completedMap={activeRound.holes}
              currentHole={currentHole}
              onJump={n => setCurrentHole(n)}
            />
          </div>
          <HoleEntry
            key={currentHole}
            hole={holesConfig[currentHole - 1]}
            initialData={activeRound.holes[currentHole]}
            holesTotal={holesConfig.length}
            courseHoles={holesConfig}
            roundHoles={activeRound.holes}
            onSaveAndGo={(data, dest) => handleSaveAndGo(currentHole, data, dest)}
          />
        </div>
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
            onExport={() => setView('export')}
            onCoach={() => setView('coach')}
            onSignOut={handleSignOut}
            displayName={profile?.display_name}
          />
        )}

        {view === 'settings' && (
          <CourseEditor holesConfig={holesConfig} onSave={handleSaveCourse} onBack={() => setView('home')} />
        )}

        {view === 'stats' && (
          <StatsView roundsIndex={roundsIndex} holesConfig={holesConfig} onBack={() => setView('home')} onDeleteRound={handleDeleteRound} />
        )}

        {view === 'export' && (
          <ExportData roundsIndex={roundsIndex} holesConfig={holesConfig} onBack={() => setView('home')} />
        )}

        {view === 'coach' && (
          <CoachNotes roundsIndex={roundsIndex} holesConfig={holesConfig} onBack={() => setView('home')} />
        )}
      </div>
    </div>
  );
}

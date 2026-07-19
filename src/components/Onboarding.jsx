import React, { useState } from 'react';
import { Flag, Check } from 'lucide-react';
import { C, SECTION_TITLE_STYLE } from '../theme.js';
import BigButton from './BigButton.jsx';
import CourseEditor from './CourseEditor.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { courseRowToHolesConfig, saveCourseHoles } from '../lib/courseSync.js';

export default function Onboarding({ userId, course, onDone }) {
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [localCourse, setLocalCourse] = useState(course);

  async function handleContinue() {
    setBusy(true);
    try {
      if (supabase && displayName.trim()) {
        await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId);
      }
    } finally {
      setBusy(false);
      onDone(displayName.trim());
    }
  }

  async function handleSaveCourse(newHolesConfig) {
    if (localCourse?.id) {
      await saveCourseHoles(localCourse.id, newHolesConfig);
      setLocalCourse({ ...localCourse, holes: newHolesConfig.map(h => ({ number: h.number, par: h.par, yards: h.yards, handicap_index: h.handicap })) });
    }
    setEditingCourse(false);
  }

  if (editingCourse) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 14px 24px' }}>
          <CourseEditor holesConfig={courseRowToHolesConfig(localCourse)} onSave={handleSaveCourse} onBack={() => setEditingCourse(false)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px', width: '100%' }}>
        <div style={{ textAlign: 'center', margin: '18px 0 24px' }}>
          <Flag size={36} color={C.pine} style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 22, fontWeight: 600, color: C.ink }}>Welcome</div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>A couple quick things, then you're in.</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={SECTION_TITLE_STYLE}>Your Name</div>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Sam"
            style={{ width: '100%', border: `1px solid ${C.line}`, background: C.card, borderRadius: 12, padding: '12px 14px', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={SECTION_TITLE_STYLE}>Your Course</div>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, color: C.ink }}>{localCourse?.name || 'Buckhorn Springs'}</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft }}>{localCourse?.tee_name || 'Black'} Tees · 18 holes</div>
            </div>
            <button
              type="button"
              onClick={() => setEditingCourse(true)}
              style={{ background: 'none', border: `1.5px solid ${C.navy}`, color: C.navy, borderRadius: 10, padding: '8px 12px', fontSize: 12.5, fontWeight: 700 }}
            >
              Edit
            </button>
          </div>
        </div>

        <BigButton onClick={handleContinue} disabled={busy}>
          {busy ? 'Saving…' : (
            <>
              <Check size={19} /> Continue
            </>
          )}
        </BigButton>
      </div>
    </div>
  );
}

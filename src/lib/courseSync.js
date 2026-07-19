import { supabase } from './supabaseClient.js';
import { HOLES_DATA } from '../data/course.js';

// Server holes use `handicap_index` (matches the build-plan schema and reads
// cleanly for an AI). The app's local/UI code uses `handicap`. Convert at
// the boundary so nothing else in the app has to know the difference.
export function courseRowToHolesConfig(row) {
  if (!row || !row.holes) return HOLES_DATA;
  return row.holes.map(h => ({ number: h.number, par: h.par, yards: h.yards, handicap: h.handicap_index }));
}

function holesConfigToServerHoles(holesConfig) {
  return holesConfig.map(h => ({ number: h.number, par: h.par, yards: h.yards, handicap_index: h.handicap }));
}

// Get the account's course, seeding Buckhorn Springs Black tees as the
// default the first time a user shows up with no course row yet.
export async function fetchOrCreateCourse(userId) {
  if (!supabase || !userId) return null;
  const { data: existing, error } = await supabase
    .from('courses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('fetchOrCreateCourse: read failed', error);
    return null;
  }
  if (existing) return existing;

  const { data: created, error: insertErr } = await supabase
    .from('courses')
    .insert({
      owner_id: userId,
      name: 'Buckhorn Springs',
      tee_name: 'Black',
      holes: holesConfigToServerHoles(HOLES_DATA),
    })
    .select()
    .single();

  if (insertErr) {
    console.error('fetchOrCreateCourse: seed failed', insertErr);
    return null;
  }
  return created;
}

export async function saveCourseHoles(courseId, holesConfig) {
  if (!supabase || !courseId) return { ok: false, reason: 'not-configured' };
  const { error } = await supabase
    .from('courses')
    .update({ holes: holesConfigToServerHoles(holesConfig) })
    .eq('id', courseId);
  if (error) {
    console.error('saveCourseHoles failed', error);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

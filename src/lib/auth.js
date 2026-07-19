import { supabase } from './supabaseClient.js';

export async function signUp(email, password) {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error: error?.message };
}

export async function signIn(email, password) {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error: error?.message };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// Magic-link password recovery (Part 4 of the build plan).
export async function sendPasswordReset(email) {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error: error?.message };
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

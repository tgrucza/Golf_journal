// ---------- storage helpers ----------
export function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const STORAGE_PREFIX = 'buckhorn-golf-journal:';
export async function storageGet(key) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
export async function storageSet(key, value) {
  try { window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); }
  catch (e) { console.error('storage set failed', key, e); }
}
export async function storageDelete(key) {
  try { window.localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) { /* ignore */ }
}

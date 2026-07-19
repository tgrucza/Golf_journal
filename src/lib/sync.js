import { supabase } from './supabaseClient.js';
import { storageGet, storageSet } from './storage.js';
import { roundPar } from './format.js';

const QUEUE_KEY = 'sync-queue';

// ---------- local round <-> server row shape ----------

function localHoleToRow(roundId, num, h, holesConfig) {
  const cfg = holesConfig.find(c => c.number === Number(num));
  return {
    round_id: roundId,
    hole_number: Number(num),
    par: cfg ? cfg.par : null,
    yards: cfg ? cfg.yards : null,
    handicap_index: cfg ? cfg.handicap : null,
    score: h.score ?? null,
    tee_shot: h.teeShot ?? null,
    tee_trouble: h.teeTrouble ?? null,
    approach: h.approach ?? null,
    approach_trouble: h.approachTrouble ?? null,
    short_sided: !!h.shortSided,
    chip_result: h.shortGame ?? null,
    putts: h.putts ?? null,
    first_putt: h.firstPutt ?? null,
    first_putt_break: h.firstPuttBreak ?? null,
  };
}

function serverRoundToLocal(serverRound) {
  const holes = {};
  (serverRound.hole_results || []).forEach(hr => {
    holes[hr.hole_number] = {
      score: hr.score,
      teeShot: hr.tee_shot,
      teeTrouble: hr.tee_trouble,
      approach: hr.approach,
      approachTrouble: hr.approach_trouble,
      shortSided: hr.short_sided,
      shortGame: hr.chip_result,
      putts: hr.putts,
      firstPutt: hr.first_putt,
      firstPuttBreak: hr.first_putt_break,
    };
  });
  return {
    id: serverRound.local_id,
    date: serverRound.date_played,
    holes,
    finished: serverRound.finished,
  };
}

// ---------- push (local -> server) ----------

export async function pushRound(round, holesConfig, userId, courseId) {
  if (!supabase || !userId) return { ok: false, reason: 'not-authed' };
  try {
    const holesArr = Object.values(round.holes || {});
    const totalScore = holesArr.reduce((s, h) => s + (h.score || 0), 0);
    const totalPar = roundPar(round, holesConfig);

    const { data: roundRow, error: roundErr } = await supabase
      .from('rounds')
      .upsert(
        {
          user_id: userId,
          course_id: courseId || null,
          local_id: round.id,
          date_played: round.date,
          holes_played: holesArr.length,
          total_score: totalScore,
          total_par: totalPar,
          finished: !!round.finished,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,local_id' }
      )
      .select()
      .single();
    if (roundErr) throw roundErr;

    const rows = Object.entries(round.holes || {}).map(([num, h]) => localHoleToRow(roundRow.id, num, h, holesConfig));
    if (rows.length) {
      const { error: holesErr } = await supabase.from('hole_results').upsert(rows, { onConflict: 'round_id,hole_number' });
      if (holesErr) throw holesErr;
    }
    return { ok: true };
  } catch (e) {
    console.error('pushRound failed (will retry later)', e);
    return { ok: false, reason: e.message };
  }
}

export async function deleteRoundRemote(userId, localId) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('rounds').delete().eq('user_id', userId).eq('local_id', localId);
  } catch (e) {
    console.error('deleteRoundRemote failed', e);
  }
}

// ---------- retry queue ----------
// Every hole save queues its round id, then we try to flush immediately.
// Anything that fails (offline, weak signal) stays queued and is retried
// on the next save, or when the app regains focus / comes back online.

export async function queueRoundSync(roundId) {
  const queue = (await storageGet(QUEUE_KEY)) || [];
  if (!queue.includes(roundId)) {
    queue.push(roundId);
    await storageSet(QUEUE_KEY, queue);
  }
}

export async function flushSyncQueue(userId, holesConfig, courseId) {
  if (!supabase || !userId) return;
  const queue = (await storageGet(QUEUE_KEY)) || [];
  if (!queue.length) return;

  const remaining = [];
  for (const roundId of queue) {
    const round = await storageGet('round-' + roundId);
    if (!round) continue; // deleted locally since queued — nothing to push
    const result = await pushRound(round, holesConfig, userId, courseId);
    if (!result.ok) remaining.push(roundId);
  }
  await storageSet(QUEUE_KEY, remaining);
}

// ---------- pull (server -> local) ----------

export async function pullRoundsFromServer(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('rounds')
    .select('*, hole_results(*)')
    .eq('user_id', userId)
    .order('date_played', { ascending: true });
  if (error) {
    console.error('pullRoundsFromServer failed', error);
    return null;
  }
  return data;
}

// Merge server rounds into the local cache. Simple last-write-wins, with one
// guard: a round still sitting in the pending sync queue has unsynced local
// edits, so local wins and the server copy is skipped for that round.
export async function mergeServerRounds(userId) {
  const serverRounds = await pullRoundsFromServer(userId);
  if (!serverRounds) return null;

  const queue = (await storageGet(QUEUE_KEY)) || [];
  let idx = (await storageGet('rounds-index')) || [];

  for (const sr of serverRounds) {
    const local = serverRoundToLocal(sr);
    if (queue.includes(local.id)) continue;

    await storageSet('round-' + local.id, local);
    if (sr.finished) {
      const summary = { id: local.id, date: local.date, totalScore: sr.total_score, totalPar: sr.total_par, holesPlayed: sr.holes_played };
      idx = [...idx.filter(r => r.id !== local.id), summary];
    }
  }

  await storageSet('rounds-index', idx);
  return idx;
}

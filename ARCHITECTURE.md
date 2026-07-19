# Buckhorn Springs Shot Journal — Architecture (Phases 3–5)

This documents what was built on top of the Phase 1–2 foundation (Vite + React,
course editor, CSV export — already shipped and live). It covers accounts,
cloud storage, multi-user support, and the optional AI coach layer. Written so
any developer (human or AI) can pick this up without re-reading the whole repo.

## Status

- **Phase 1–2**: Done, deployed, in use.
- **Phase 3 (accounts + cloud storage)**: Built, not yet deployed. Needs a
  real Supabase project and env vars — see "What's left to do" below.
- **Phase 4 (multi-user polish)**: Built alongside Phase 3 (onboarding,
  per-user scoping). "Compare with friends" was explicitly left out, per plan.
- **Phase 5 (AI coach)**: Built. Needs `ANTHROPIC_API_KEY` set in Netlify to
  work; degrades to a friendly error message if it's missing.

## What's left to do (not something I can do from here)

1. Create a Supabase project and run `supabase/migration.sql` in its SQL
   Editor.
2. Copy the project's URL and anon key into `.env` (local) and into Netlify's
   site environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Set `ANTHROPIC_API_KEY` in Netlify's environment variables (server-side
   only — do not prefix with `VITE_`, or it will be bundled into the client).
4. In Supabase Auth settings, confirm email confirmation / redirect URLs
   point at the deployed Netlify URL (relevant for signup confirmation and
   password reset emails).
5. Test on a phone: sign up, log a round, confirm it appears in Supabase, log
   out, log in on a second device, confirm the round is there.

Claude Code should do 1–3 as part of finishing the build (see the handoff
prompt). The Supabase dashboard interaction and Netlify env vars need a human
with account access at some point — Claude Code can walk the user through it
or use CLI tools if available.

## Data model

Four Postgres tables, defined in `supabase/migration.sql`. Row Level Security
is on for all of them — every policy is "you can only touch rows that belong
to you."

- **`profiles`** — one row per user. Auto-created by a database trigger the
  moment someone signs up (`handle_new_user()`), so the client never has to
  race to create it. `display_name` starts `null` until onboarding sets it.
- **`courses`** — one row per course a user has set up. Seeded automatically
  on first login with Buckhorn Springs Black tees (see `courseSync.js`).
  `holes` is a JSONB array: `[{number, par, yards, handicap_index}, ...]`.
- **`rounds`** — one row per round. `local_id` is the client-generated id
  (e.g. `r1a2b3c`, from `uid()` in `storage.js`) — it's how the sync layer
  reconciles a localStorage round with its server row. `(user_id, local_id)`
  is unique, which is also what upserts key off of.
- **`hole_results`** — one row per hole per round, flattened and
  denormalized (par/yards/handicap are copied onto the row so historical
  rounds stay accurate if the course definition changes later). This is the
  AI-facing table — plain-English values, no joins needed to read it.

### Field name mapping (important gotcha)

The app's internal JS objects use different field names than the database
columns, for historical reasons (the local data shape predates the Supabase
schema and Phase 1–2 code wasn't touched). The conversion happens in exactly
two places — don't let a third mapping drift in elsewhere:

| Local (JS, in `round.holes[n]`) | Server column (`hole_results`) |
|---|---|
| `teeShot` | `tee_shot` |
| `teeTrouble` | `tee_trouble` |
| `approach` | `approach` |
| `approachTrouble` | `approach_trouble` |
| `shortSided` | `short_sided` |
| `shortGame` | `chip_result` |
| `putts` | `putts` |
| `firstPutt` | `first_putt` |
| `firstPuttBreak` | `first_putt_break` |
| `score` | `score` |

Conversion lives in `src/lib/sync.js` (`localHoleToRow` / `serverRoundToLocal`).

Course holes have one mapping too: local `handicap` ↔ server
`handicap_index`. Conversion lives in `src/lib/courseSync.js`
(`courseRowToHolesConfig` / `holesConfigToServerHoles`).

## Auth flow

1. `src/lib/supabaseClient.js` creates the Supabase client from
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. If either is missing,
   `supabaseConfigured` is `false` and the app shows `ConfigMissing.jsx`
   instead of crashing.
2. `App.jsx` checks for a session on mount (`getSession()`), then subscribes
   to `onAuthStateChange` for the rest of the session's life.
3. No session → `AuthScreen.jsx` (email/password sign up, log in, or a
   magic-link password reset).
4. Session but no `profiles.display_name` yet → `Onboarding.jsx` (asks for a
   display name, shows the seeded course with an inline edit option using
   the existing `CourseEditor.jsx`).
5. Session + onboarded, but local rounds exist that haven't been offered for
   upload yet → `MigrationPrompt.jsx`.
6. All clear → the normal app (`Home` → play / stats / export / settings /
   coach), same as Phase 1–2, now scoped to the logged-in account.

Sign out is a button in `Home.jsx`'s footer; it just calls `supabase.auth.signOut()`
and resets local React state — it does **not** clear localStorage, so if the
same person logs back in, their local cache is still there (and the pending
sync queue, if anything didn't finish syncing, picks up where it left off).

## Local-first sync (the core of Phase 3)

Every save still hits `localStorage` first and instantly, exactly like
Phase 1–2 — that part of the app didn't change. `src/lib/sync.js` adds a
background layer on top:

- **`queueRoundSync(roundId)`** — after any hole save or round finish, the
  round's id gets pushed into a small pending-sync list (`sync-queue` key in
  localStorage).
- **`flushSyncQueue(userId, holesConfig, courseId)`** — walks that list,
  upserts each round into `rounds` and its holes into `hole_results`.
  Anything that fails (offline, weak signal) stays in the queue for the next
  attempt. This is called after every save, and also on `window focus` /
  `window online` events (see the effect in `App.jsx`), so a dead spot mid-
  round quietly catches up once signal comes back.
- **`mergeServerRounds(userId)`** — called once per session bootstrap. Pulls
  every round + its holes from Supabase and writes them into localStorage.
  Last-write-wins, with one guard: if a round is still sitting in the pending
  sync queue (meaning there are local edits that haven't made it to the
  server yet), the server copy is skipped for that round so it doesn't
  clobber unsynced work.
- **`deleteRoundRemote(userId, localId)`** — fire-and-forget delete on the
  server when a round is deleted locally (via cascade, this also removes its
  `hole_results` rows).

No service workers, no IndexedDB, no offline queue infrastructure — this
matches the plan's explicit call to keep it to "a small utility function,"
not an offline-first architecture. It assumes cell service is available and
only needs to tolerate brief signal dips.

## Course sync

`src/lib/courseSync.js`:

- **`fetchOrCreateCourse(userId)`** — looks for an existing course row owned
  by the user; if none exists (first login), seeds one with Buckhorn Springs
  Black tees from `src/data/course.js`.
- **`saveCourseHoles(courseId, holesConfig)`** — pushes edits from
  `CourseEditor.jsx` back to the server. `CourseEditor.jsx` itself is
  untouched from Phase 2 — it's reused as-is from both the normal Settings
  view and from inside `Onboarding.jsx`.

Known gap: the Phase 2 plan called for multi-tee support (Black/White/Gold),
but the shipped Phase 2 code only has a single tee per course. The `courses`
table supports `tee_name` and could hold multiple rows per user for this
later, but the UI for switching tees doesn't exist yet. Not addressed in this
pass — flagging it so it doesn't get lost.

## AI coach (Phase 5)

- **`netlify/functions/coach-analysis.js`** — a standard Netlify Function
  (not an Edge Function). Receives `{ csv }` in a POST body, sends it to the
  Anthropic API (`claude-sonnet-5`) with a fixed coaching system prompt, and
  returns `{ analysis: "..." }`. The API key (`ANTHROPIC_API_KEY`) is read
  from `process.env` — it only exists on Netlify's servers, never shipped to
  the client.
- **`src/components/CoachNotes.jsx`** — new "Coach's Notes" tab, reachable
  from `Home.jsx`. Reuses the exact CSV-building code from Phase 2's export
  feature (`buildCsvRows` / `rowsToCsvString` in `lib/csvExport.js`) so the
  data the AI sees is identical to what a person would get from "Export CSV."
  POSTs to `/api/coach-analysis`, which `netlify.toml` redirects to the
  function.
- This is additive and optional — the plain CSV/Copy-for-AI export from
  Phase 2 still works exactly as before and needs no API key. If
  `ANTHROPIC_API_KEY` is never set, the Coach's Notes tab just shows a
  friendly "not configured yet" message instead of erroring.

## New/changed files, at a glance

```
supabase/migration.sql          Full schema + RLS (run once in Supabase SQL Editor)
.env.example                    Template for local + Netlify env vars

src/lib/supabaseClient.js       Supabase client singleton
src/lib/auth.js                 signUp / signIn / signOut / password reset
src/lib/courseSync.js           Per-account course fetch/seed/save
src/lib/sync.js                 Local-first push/pull/merge/delete

src/components/ConfigMissing.jsx    Shown if Supabase env vars are absent
src/components/AuthScreen.jsx       Sign up / log in / reset password
src/components/Onboarding.jsx       First-login: display name + confirm course
src/components/MigrationPrompt.jsx  First-login: offer to upload local rounds
src/components/CoachNotes.jsx       Phase 5 AI coach tab

netlify/functions/coach-analysis.js Serverless function, calls Anthropic API
netlify.toml                        Added [functions] block + /api redirect

src/App.jsx                     Rewired: auth/onboarding/migration gating,
                                 sync calls wired into every save/delete
src/components/Home.jsx         Added Coach's Notes nav + sign out footer
package.json                    Added @supabase/supabase-js
```

Nothing in `src/components/HoleEntry.jsx`, `Scorecard.jsx`, `StatsView.jsx`,
`ExportData.jsx`, `CourseEditor.jsx`, or any of the small presentational
components (`Stepper`, `TogglePill`, `OptionGrid`, etc.) was touched — the
Phase 1–2 data-capture experience is exactly as it was.

## Verified

`npm install && npm run build` succeeds with no errors (tested with
placeholder Supabase env vars, since the build needs *some* values present at
build time — real ones get baked in at Netlify's build step once the actual
project env vars are set there).

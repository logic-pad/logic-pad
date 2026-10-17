# Puzzle Seen/Solved Indicators — Implementation Plan

Status: **implemented** (backend + frontend). This document is the build spec
for per-card `unseen` / `solved` indicators across the site, covering both repos
(`logic-pad` frontend, `logic-pad-api` backend sibling). Read
[`docs/ui.md`](../ui.md) first for frontend structure and design language.

## Contents

- [Goal](#goal)
- [Locked decisions](#locked-decisions)
- [Rejected alternatives](#rejected-alternatives)
- [Architecture](#architecture)
- [Storage layer: `progressDb.ts`](#storage-layer-progressdbts)
- [The tracker as source of truth](#the-tracker-as-source-of-truth)
- [Load and refresh lifecycle](#load-and-refresh-lifecycle)
- [Concurrency and StrictMode invariants](#concurrency-and-strictmode-invariants)
- [React bridge: `useSolveStatus`](#react-bridge-usesolvestatus)
- [Rendering the indicators](#rendering-the-indicators)
- [Backend](#backend)
- [Scale budget](#scale-budget)
- [Files to touch](#files-to-touch)
- [Optional: cross-tab live sync](#optional-cross-tab-live-sync)
- [Out of scope](#out-of-scope)
- [Implementation order](#implementation-order)
- [Verification](#verification)
- [Gotchas](#gotchas)

## Goal

Every puzzle card, everywhere on the site, shows the current user's own
relationship to that puzzle without a per-card request:

- **Unseen** — a primary-colored dot in the **top-left** corner. The puzzle has
  never been opened by this user.
- **Solved** — a faint rotated checkmark **stamp** in the **bottom-right**
  corner.

Constraints that shaped the design:

1. **No server spam.** Zero requests per card and per page.
2. **Never block list rendering.** Puzzle lists paint immediately; indicators
   pop in when progress data arrives. No flash of *wrong* indicators.
3. **Centralized truth.** `onlineSolveTracker` is the single source of truth for
   solve status, backed by the server rather than `sessionStorage`.
4. **Durable and shared.** Progress persists in IndexedDB: forever, across tabs
   and reloads.
5. **10k+ ids** per user must stay comfortable (most active user: ~1k solved and
   growing).

## Locked decisions

| Question | Decision |
| --- | --- |
| Meaning of the dot | Plain `!seen` (never opened), **not** "new since last play" |
| Surfaces | All 8 `PuzzleCard` call sites **plus** the `CollectionPanel` solve-screen sidebar rows |
| Supporter gate | None — free for every signed-in user; the existing supporter-only search *filter* is untouched |
| Storage | IndexedDB via [`idb`](https://github.com/jakearchibald/idb) (~1 KB gz) |
| Freshness | Refresh from server on load, skipped if fetched within the last 10 minutes |
| Wire format | `seen` and `solved` are **disjoint** (solved ids omitted from `seen`) to avoid shipping an id twice; local stores stay cumulative (`seen` ⊇ `solved`) |
| Cross-tab live update | Optional add-on; requirement is only that other tabs are fresh on refresh |
| Sign-out | Clears local progress (no leak on shared devices); server repopulates on next sign-in |

## Rejected alternatives

Recorded so nobody re-litigates them.

- **Join status into every list response** (`PuzzleBrief` gains
  `seen`/`solved`). `GET /frontpage` is served from a global single-slot
  `TimedSwrCache` (`logic-pad-api/packages/api/src/routes/frontpage.ts:15-74`),
  so per-user data either leaks across users or destroys the cache. Also bloats
  every page payload and couples list-cache freshness to progress freshness:
  every solve invalidates every cached list.
- **`POST /puzzle/status {puzzleIds}` per page.** One request per 30-item page
  is not spam, but it is a waterfall *behind* each list, query keys differ per
  list so the same puzzle is re-queried across screens, and all 8 call sites
  need wiring.
- **TanStack Query atom instead of the tracker** (earlier draft of this plan).
  Rejected in favour of the IndexedDB tracker: it persists across sessions,
  works offline, is shared between tabs, and gives one place to own the
  freshness policy.

## Architecture

```
                       GET /user/me/progress   (≥10 min apart, background)
                                    │
   Postgres solve_sessions ─────────┘
   (unique per user+puzzle, solved_at nullable)
                                    │
                                    ▼
                    ┌──────────────────────────────┐
   ProgressBootstrap│  onlineSolveTracker (singleton)│←─ markSeen/markSolved
   (main.tsx, reads │  Sets + version + subscribers │←─ completeSolve
    useOnline())    └──────────────┬───────────────┘
                                   │ subscribe / getVersion
                                   ▼
                          useSolveStatus(puzzleId)
                                   │
                 ┌─────────────────┼──────────────────┐
                 ▼                 ▼                  ▼
           PuzzleCard     CollectionPanel rows   PuzzleSolveControl
           (8 call sites)  (sidebar series list)  (banner + beacon gate)
                                   ▲
                                   │ read/write (idb, 3 stores)
                          IndexedDB "logic-pad-progress"
                          shared by every tab, survives reloads
```

Lists never wait for any of this. The tracker hydrates from IndexedDB (a few
milliseconds, off the critical path), renders repaint, then a background fetch
may land later and repaint again.

## Storage layer: `progressDb.ts`

New file `src/client/online/progressDb.ts`. Sole owner of the `idb` dependency;
nothing else in the client touches IndexedDB.

```
db    "logic-pad-progress"   version 1
  store "seen"    key = puzzleId   value = firstSeenAt (epoch ms)
  store "solved"  key = puzzleId   value = solvedAt    (epoch ms)
  store "meta"    key = string     value = string | number
        "userId"    → bound account id, or "anonymous"
        "fetchedAt" → epoch ms of last successful server refresh
        "schema"    → 1
```

**Local stores are cumulative, unlike the wire format:** a solved puzzle has a
record in *both* stores (`seen` ⊇ `solved`). The server omits solved ids from
`seen` to save bandwidth, so the refresh path unions them back in (see
[Load and refresh lifecycle](#load-and-refresh-lifecycle)). Keeping the local
invariant means `markSolved` is a pure addition and the dot check stays a
single `!seen.has(id)`.

Per-id records rather than one blob array:

- a solve writes **1–2 tiny records**, not a re-serialised ~400 KB array;
- `getAllKeys` over 10k keys is a single-digit-ms cursor scan;
- storing the timestamp as the value is free, and unlocks the "new since last
  play" refinement later with **no schema bump**.

Every exported function is wrapped in `try`/`catch`. If `indexedDB.open`
rejects — Firefox private mode, Safari ITP eviction, disabled storage, or a
browser without IDB — the module reports failure and the tracker degrades to
in-memory-only for the session. **No exception ever escapes this module.**

Surface (all async, all safe):

```ts
export const PROGRESS_SCHEMA_VERSION = 1;
export const ANONYMOUS = 'anonymous';

openProgressDb(): Promise<ProgressDb | null>   // null when unavailable
readMeta(): Promise<{ userId: string | null; fetchedAt: number | null }>
writeMeta(patch): Promise<void>
readKeys(store: 'seen' | 'solved'): Promise<string[]>
writeKeys(store, ids: readonly string[]): Promise<void>   // clear + bulk put
upsertSeen(id, at) / upsertSolved(id, at): Promise<void>  // single record
clearAll(): Promise<void>
```

## The tracker as source of truth

`src/client/router/onlineSolveTracker.ts` is rewritten in place. It keeps its
module-singleton export shape (`export default new OnlineSolveTracker()`) so
existing importers do not change.

State held on the instance:

```ts
private seen: Set<string>;
private solved: Set<string>;
private loaded: boolean;          // false until hydrate finishes
private boundTo: string | null;   // null = never bound this session
private version: number;          // bumped on every observable change
private generation: number;       // guards async work, see below
private pendingLocal: Set<string>;// marks made during an in-flight refresh
private subscribers: Set<() => void>;
private db: ProgressDb | null;    // null = degraded / unavailable
```

Public API:

```ts
subscribe(fn: () => void): () => void
getVersion(): number
isLoaded(): boolean
isTracked(): boolean               // bound to a real account (not anonymous)
isSeen(id: string): boolean
isSolved(id: string): boolean        // signature preserved
markSeen(id: string): void
markSolved(id: string): void
bind(userId: string): void           // idempotent; drives all async work
refreshIfStale(): Promise<void>      // 10-minute policy
completeSolve(id, ms?, data?): Promise<boolean>   // unchanged
sendSolving(...) / sendSolvingBeacon(...)          // unchanged
clearSolveRecords(): Promise<void>
```

`sessionStorage.alreadySolved` is **deleted**, along with the JSON parse
round-trip in every method.

`markSeen` / `markSolved` are synchronous on the Sets, bump `version`, and fire
-and-forget the IndexedDB write. Callers never await them.

`completeSolve` keeps its contract (`false` if already solved, so a solve is
reported once) but now consults the persistent set. This is strictly more
correct than today: reloading the page no longer lets the same solve be
re-reported. The HTTP calls it makes are unchanged, so anonymous solves still
reach `POST /session/:id/complete` (that route is `optionalUser` and feeds the
global `puzzles.solve_count`).

`clearSolveRecords()` keeps its name and is still called from
`online/api.ts:124` (sign-in) and `:177` (logout) as a belt-and-braces reset,
but the **authoritative** account reset now lives in `bind()`.

## Load and refresh lifecycle

`ProgressBootstrap` is a new `memo` component mounted in `main.tsx` beside
`VersionMismatchWatcher` (`main.tsx:50`). It renders `null` and owns exactly one
effect:

```ts
const { isOnline, me, isPending } = useOnline();
useEffect(() => {
  if (isPending) return;                     // cannot yet tell signed-in from anonymous
  if (!isOnline) return;                     // leave the tracker alone: no wipe, no fetch
  onlineSolveTracker.bind(me?.id ?? ANONYMOUS);
}, [isOnline, me, isPending]);
```

The `isPending` guard is required because `meAtom` (`state/online.ts:56-59`)
collapses "still loading" and "not signed in" both to `null`. Without it, boot
would briefly bind to `ANONYMOUS` and **wipe the real account's cached
progress**.

**Anonymous visitors must still bind**, to `ANONYMOUS`, so that their solves
persist locally and the `PuzzleSolveControl` banner ("Puzzle solved!" / "Sign in
to track solves") keeps working across a reload. But binding sets `loaded = true`
with an *empty* `seen` set, which would render a dot on **every** card for every
logged-out visitor. Hence the second half of the gate: `isTracked()` is false for
`ANONYMOUS`, and `useSolveStatus.loaded` is `isLoaded() && isTracked()`. Card
indicators therefore appear only for signed-in users, while `isSolved()` stays
usable for anonymous local tracking. This was not in the original design — the
prose said "anonymous shows nothing" while the lifecycle code as written did the
opposite; the contradiction surfaced only when the two were tested together.

`bind(userId)`:

1. If `userId === boundTo`, return (idempotent — this is what makes StrictMode
   double-invocation harmless).
2. `const gen = ++generation`.
3. Read `meta.userId`. If it exists and differs from `userId`, wipe both stores
   (account switch or sign-out). Write `meta.userId = userId`.
4. Hydrate `seen` / `solved` from `getAllKeys` on both stores.
5. If `gen` is still current: set `loaded = true`, bump `version` → **cards
   repaint from cache with no network involved**.
6. Then, still under `gen`, call `refreshIfStale()`.

`refreshIfStale()`:

1. Skip when `userId === ANONYMOUS` (nothing on the server to fetch) or when the
   tracker is degraded.
2. Skip when `Date.now() - fetchedAt < REFRESH_INTERVAL`. A returning visitor
   inside the window does **zero** network for progress.
3. `GET /user/me/progress`. On success: **union the two disjoint arrays into the
   local seen Set** (`new Set([...resp.seen, ...resp.solved])`), take the solved
   Set from `resp.solved` alone, re-union `pendingLocal` (marks made while the
   request was in flight), persist via `writeKeys` in one transaction, write
   `meta.fetchedAt`, bump `version` → cards repaint again. The wire format is
   disjoint but the local stores are **cumulative** (`seen` ⊇ `solved`), which is
   what keeps `markSolved` a pure addition and the dot check a single
   `!seen.has(id)`.
4. On failure: log and leave the cached state intact. Never surface a toast —
   indicators are cosmetic.

Constants, module-private in the tracker:

```ts
const REFRESH_INTERVAL = 10 * 60 * 1000;
```

## Concurrency and StrictMode invariants

`main.tsx:47` renders under `React.StrictMode`, so effects double-fire in dev.
Three rules keep that (and rapid `me` transitions, and offline flips) safe:

- **Generation counter.** Every async step in `bind` checks `gen ===
  generation` before mutating state or bumping `version`. A stale hydration or
  an in-flight refresh whose generation moved on is discarded outright. This is
  the same idiom already used for solve runs in
  `components/gridInsight/GridInsight.tsx:53`.
- **Idempotent `bind`.** Step 1 returns early on a matching account, so the
  second StrictMode invocation does nothing at all.
- **`pendingLocal` merge.** Marks recorded while a refresh is in flight are
  re-unioned after the replace, so solving a puzzle in the same instant a
  background refresh lands cannot lose its stamp.

## React bridge: `useSolveStatus`

Lives with the tracker (same module, or a sibling file if the tracker grows).

```ts
export function useSolveStatus(puzzleId?: string) {
  const version = useSyncExternalStore(
    onlineSolveTracker.subscribe,
    onlineSolveTracker.getVersion,
    onlineSolveTracker.getVersion   // getServerSnapshot: same, SSR-safe
  );
  return useMemo(
    () => ({
      loaded: onlineSolveTracker.isLoaded(),
      seen: !!puzzleId && onlineSolveTracker.isSeen(puzzleId),
      solved: !!puzzleId && onlineSolveTracker.isSolved(puzzleId),
    }),
    [puzzleId, version]
  );
}
```

The **version counter** is the snapshot, not the Sets — subscribing to a mutable
collection is the classic `useSyncExternalStore` infinite-loop bug.

`useSyncExternalStore` rather than a jotai atom, because the tracker is an
unscoped module singleton: progress is per-**account**, not per-puzzle-instance,
so it must be shared by embedded modals and `EmbeddedPuzzleScope` rather than
scoped. An atom would invite accidental scoping and give a second, divergent
copy of the truth.

Consumers:

- `online/PuzzleCard.tsx` — derives `unseen = loaded && !seen`.
- `online/CollectionPanel.tsx` — same, inside the row map at `:137-179`.
- `components/PuzzleSolveControl.tsx` — switches to the hook, which fixes a real
  latent bug: the anonymous banner reads `tracker.isSolved(id)` inside a
  `useMemo` keyed only on `[id]` (`:55-58`), which is benign while status came
  from synchronous `sessionStorage` but goes stale once hydration is async.

## Rendering the indicators

Both indicators render **only** when `loaded` is true. `useSolveStatus.loaded`
is `isLoaded() && isTracked()` — the second half is the anonymous gate added
during implementation (see below), and it also suppresses indicators on
`/dev/puzzles` (synthetic ids,
`routes/(local)._layout.dev.puzzles.lazy.tsx:50-94`), whose ids can never
appear in `seen`.

Inside the existing `relative` root of `PuzzleCard.tsx:172-184`:

```
dot    <span aria-hidden class="absolute top-1 left-1 size-2.5 rounded-full
                              bg-primary ring-2 ring-base-300 pointer-events-none" />
stamp  <span aria-hidden class="absolute bottom-1 right-1 z-0 opacity-15
                              -rotate-12 pointer-events-none"><FaCheck size={44}/></span>
```

- `ring-base-300` keeps the dot legible on the private-card variant, which uses
  a translucent `bg-base-300/50` (`PuzzleCard.tsx:176-178`).
- Accessibility: the spans are `aria-hidden`, and `; Unseen` / `; Solved` is
  appended to the existing `aria-label` string at `PuzzleCard.tsx:182`.
- Corner collision: three call sites already pin opaque badges to
  `bottom-0 right-0` for selection — `online/AddPuzzlesModal.tsx:96`,
  `routes/_layout.my-stuff.puzzles.lazy.tsx:141`,
  `routes/_layout.collection.$collectionId.lazy.tsx:656`. Add `z-10` to those
  existing children so they simply cover the stamp in selection mode. No new
  prop, no layout change.
- `CollectionPanel` rows are `btn` elements, so the same two spans work with
  `relative` on the row link and `ring-base-200`/`ring-base-100` matched to the
  row's background variant.

## Backend

`logic-pad-api` — three files, **no schema change**.

`solve_sessions` (`packages/shared/src/db/schema.ts:266-285`) is already exactly
the right store: `unique().on(userId, puzzleId)`, a row created on
`POST /session/:puzzleId/begin`, and `solved_at` nullable. So
**seen = row exists**, **solved = `solved_at IS NOT NULL`**, and the existing
`index().on(userId, solvedAt)` serves the query as an index-prefix scan.

`packages/shared/src/types.ts`, next to `MeBrief`:

```ts
export interface UserProgress {
  /**
   * Puzzles opened but not solved. Disjoint from {@link solved}: every solved
   * puzzle is also seen, but is omitted here so the payload carries no id
   * twice. Consumers that need "has the user ever opened this" must union the
   * two arrays.
   */
  seen: string[];
  /** Puzzles solved. */
  solved: string[];
}
```

**The two arrays are disjoint** — `seen` deliberately excludes solved ids, so a
heavy user does not pay twice for the same id (1k solved puzzles ≈ 36 KB raw
saved). The consequence for the client is load-bearing and easy to get wrong:
**the full opened set is `seen ∪ solved`**, and the tracker must union them
before deciding the dot. Rendering `!seen.has(id)` against the raw `seen` array
would put a dot on every solved puzzle *alongside* its stamp.

`packages/api/src/routes/user.ts`, inside the existing `/user` group, with
`user: 'verified'` like `GET /me` (`:43-91`):

```ts
.get('/me/progress', async ({ user }) => {
  const rows = await db
    .select({
      puzzleId: solveSessions.puzzleId,
      solvedAt: solveSessions.solvedAt,
    })
    .from(solveSessions)
    .where(eq(solveSessions.userId, user.id));
  const seen: string[] = [];
  const solved: string[] = [];
  for (const row of rows) {
    (row.solvedAt === null ? seen : solved).push(row.puzzleId);
  }
  return status('OK', { seen, solved } satisfies UserProgress);
}, { user: 'verified' })
```

A single pass partitions the rows; no double iteration over 10k rows.

**Route ordering does not matter** (corrected during implementation): Elysia
matches with a radix trie that prefers static segments over parameters
regardless of declaration order. Evidence in the same file —
`/me/followed-collections` is declared at `user.ts:367`, long after `/:userId`
at `:93`, and resolves correctly. `/me/progress` is also two segments, so the
one-segment `/:userId` could not match it even under sequential routing. It is
placed directly after `GET /me` purely for readability.

Tests in `packages/api/tests/user.test.ts` (3, all passing):

- 401 for anonymous;
- alice's `solved` equals the solved ground-truth rows, `seen ∪ solved` equals
  the full row set, and `seen ∩ solved` is empty;
- for charlie, an inserted `solvedAt: null` session lands in `seen` only and an
  inserted solved session lands in `solved` only (both directions of the
  disjoint boundary).

Note on the seed: **both** seeded `solve_sessions`
(`packages/shared/tests/data.ts:302-317`) have `solvedAt` set — there is no
"opened but unsolved" row to assert against, which is why the third test inserts
one (plus a solved one, to cover both directions of the disjoint boundary). The
earlier draft of this plan claimed the seed contained one of each; it does not.
Asserting against live DB rows (rather than hardcoded expectations or an "empty
arrays" case) also keeps the tests immune to seed drift and to `beforeEach`
reseed ordering.

No supporter gate on this path, so `db/data/search.ts:203-251` and its tests at
`packages/api/tests/puzzle.test.ts:794-836` stay untouched.

## Scale budget

10k ids per user:

| | cost |
| --- | --- |
| in memory | 2 Sets × 10k strings ≈ 1–2 MB |
| per solve | 1–2 IndexedDB record puts (not a blob rewrite) |
| boot hydrate | 2 `getAllKeys` scans, few ms, off the critical path |
| server payload | 10k ids total (disjoint), ~330 KB raw / ~140 KB gz, once per ≥10 min, background |
| card lookup | O(1) `Set.has`; a 30-card page is 30 lookups |
| refresh landing | one React-batched re-render pass over subscribed cards |

Because `seen` excludes solved ids, the response carries each id exactly once
regardless of how many puzzles the user finished — the worst case is bounded by
the number of opened puzzles, not `opened + solved`. For a completionist with
10k opened / 8k solved, the naive overlapping format would ship 18k ids where
this ships 10k.

The only line that still grows uncomfortably is the server response, and its
mitigation (delta sync, or a packed encoding) is additive and needs no tracker
change.

## Files to touch

**Frontend (`logic-pad`)**

| File | Change |
| --- | --- |
| `src/client/online/progressDb.ts` | ✅ **new** — idb wrapper, 3 stores, degrade-to-null |
| `src/client/router/onlineSolveTracker.ts` | ✅ rewrite: Sets + version + `bind`/`mark*`/`refreshIfStale`; drop sessionStorage |
| `src/client/online/useSolveStatus.ts` | ✅ **new** — `useSyncExternalStore` bridge |
| `src/client/online/api.ts` | ✅ `getUserProgress()` (returns `null` on failure, like `getMe`) |
| `src/client/online/data.ts` | ✅ `UserProgress` (synced from backend by hand) |
| `src/client/main.tsx` | ✅ `ProgressBootstrap` mounted beside `VersionMismatchWatcher` |
| `src/client/online/PuzzleCard.tsx` | ✅ dot + stamp + `aria-label` suffix |
| `src/client/online/CollectionPanel.tsx` | ✅ row extracted to `CollectionPuzzleRow` (hooks cannot live in a `.map` callback); same two indicators |
| `src/client/components/PuzzleSolveControl.tsx` | ✅ `markSeen` on `solveSessionBegin`; anonymous banner moved onto the hook |
| `package.json` | ✅ `idb@^8.0.4` |

**Backend (`logic-pad-api`)**

| File | Change |
| --- | --- |
| `packages/shared/src/types.ts` | ✅ add `UserProgress` after `MeBrief` |
| `packages/api/src/routes/user.ts` | ✅ add `GET /user/me/progress` after `GET /me` |
| `packages/api/tests/user.test.ts` | ✅ anonymous 401, ground-truth bucketing, inserted unsolved session |

The 8 `PuzzleCard` call sites need **no** edits — the hook is read inside the
card: `online/PuzzleSearchResults.tsx:90` (shared renderer, so it covers
`/search/puzzles` and `AddPuzzlesModal`), `online/FrontPageLists.tsx:52`,
`routes/_layout.my-stuff.puzzles.lazy.tsx:109`,
`routes/_layout.profile.$userId.lazy.tsx:132,172,191`,
`routes/_layout.collection.$collectionId.lazy.tsx:623`, and
`routes/(local)._layout.dev.puzzles.lazy.tsx:198`.

Deliberately excluded: moderator rows in `online/moderator/UserPuzzles.tsx` —
those list *another* user's puzzles, so "solved" would refer to the viewer and
read as a bug.

## Optional: cross-tab live sync

Not required (IndexedDB is shared, so tab B gets tab A's solves on refresh). If
wanted later, ~8 lines: a `BroadcastChannel('logic-pad-progress')` posting
`{ id, solved }` after each local mutation, with receivers merging into their
Sets and bumping `version`. Guard with a flag so echoed messages don't loop, and
skip the channel entirely when the tracker is degraded.

## Out of scope

- **Delta sync / ETag.** Full-set transfer is fine at current scale; an
  `If-Modified-Since` on `max(updated_at)` is a drop-in addition to the route
  with no client change.
- **"New since last play" dot.** Would need one extra scalar
  (`max(solve_sessions.created_at)`) in the response plus one condition in
  `PuzzleCard`. The per-record timestamps in IndexedDB already support it.
- **Removing `onlineSolveTracker.isSolved`'s other role.** It still gates
  `sendSolving`/`sendSolvingBeacon`; that stays.
- **Any change to the supporter-only `solve=seen|unseen|unsolved` search
  filter.**

## Implementation order

1. ✅ Backend route + DTO + tests. Independently verifiable with `bun run test`,
   and it unblocks everything else. **Done** — full suite green.
2. ✅ `progressDb.ts` + tracker rewrite + `useSolveStatus`. Verified with a
   throwaway `bun:test` file mocking `./online/api` (six invariants: disjoint
   union, cumulative `markSolved`, anonymous gate, `bind` idempotence, stale
   generation discarded, in-flight marks survive a refresh). Deleted after use —
   the repo has no frontend unit-test setup.
3. ✅ `ProgressBootstrap` in `main.tsx`, and `getUserProgress`/`UserProgress` on
   the frontend.
4. ✅ `PuzzleCard` indicators, plus the `z-10` bump on the three selection call
   sites.
5. ✅ `CollectionPanel` rows.
6. ✅ `PuzzleSolveControl`: `markSeen` on begin, banner onto the hook.

## Verification

Backend (done — all commands run from the `logic-pad-api` repo root):

- `bun run lint` — this is `tsc && eslint`, not just eslint. Both clean.
- `bun run test packages/api/tests/user.test.ts` → 17 pass, 0 fail.
- `bun run test` (full suite) → **219 pass, 0 fail across 13 files** (155 s).
- Tests need no external services: `packages/shared/tests/setup.ts` boots
  **PGlite in-memory**, regenerates `drizzle-test/**/migration.sql` from
  `schema.ts` on every run, and reseeds before each test (user ids differ
  per test). `.env.test` sets `DATABASE_URL=fake-db-url-for-tests`, and setup
  hard-exits if a real `postgresql://` URL is configured.

Frontend: `bun run lint` and `bunx --bun tsc --noEmit` from the repo root — both
clean. **Do not** run `bun build` inside `packages/logic-core`.

Headless Chrome + CDP (`docs/ui.md` workflow), against a live dev server and the
dev backend (38 public puzzles):

- **Logged out** (real path, no overrides): front page 8 cards and
  `/dev/puzzles` 30 cards render with **0 dots, 0 stamps, 0 `aria`
  annotations**, `logic-pad-progress` created at v1 with `userId: anonymous` and
  empty stores, and no `progress`/`solve` console noise. This is the
  anonymous-gate regression check.
- **Signed-in simulation**: OAuth cannot be automated, so the indicator visuals
  were verified by temporarily forcing `isTracked()` to `true` and seeding
  IndexedDB with 5 seen / 1 solved / 2 untouched ids, then reverting the
  override. Result was the exact predicted matrix — the solved card showed the
  faint rotated stamp **and no dot**, the two untouched cards showed the
  primary dot top-left, and the five seen-but-unsolved cards showed nothing.
  `aria-label` gained `; Unseen` / `; Solved` only where expected.
- **Still unverified** (needs a real account): the `GET /user/me/progress`
  refresh path end-to-end, the 10-minute skip, account-switch wipe, and the
  selection-mode `z-10` overlap. All are covered by the unit invariants above
  except the last, which is a one-line CSS assertion.

Seeding gotcha, for whoever repeats this: an init script that seeds IndexedDB
**loses the race** against the app's own `bind()` hydrate, so the first load
reads empty stores and every card renders as unseen. Seed *after* the first load
settles, then reload — that is the order the check above uses.

Remaining manual checks (all need a real signed-in account, so they are for a
human with OAuth):

- pre-load (no indicators) vs post-load (dots + stamps) on a slow connection —
  proves nothing blocks and nothing flashes wrong;
- solve screen collection sidebar with a solved and an unsolved row;
- selection mode on `/my-stuff/puzzles` and the collection page — the corner
  badge must cover the stamp;
- a private-status card (`bg-base-300/50`) — the dot's ring must stay legible;
- reload after solving — the stamp must persist (IndexedDB) and the solve must
  not be re-reported (`completeSolve` returns `false`);
- sign in as a different account — stores wipe, no stale indicators;
- offline mode toggle — no indicators, no crash, no wipe.

## Gotchas

- **`meAtom` null ambiguity** (`state/online.ts:56-59`): pending and anonymous
  both read `null`. Gate `bind` on `!isPending` or boot wipes the real account's
  cache.
- **StrictMode double-fire**: `bind` must be idempotent and every async step
  must check its generation.
- **Never snapshot the Sets** in `useSyncExternalStore`; snapshot the version
  counter.
- **Anonymous visitors must not see indicators.** They still bind (their solves
  need local persistence for the `PuzzleSolveControl` banner), which sets
  `loaded = true` with an empty `seen` set — so gating cards on `isLoaded()`
  alone puts a dot on every card for every logged-out visitor. Gate on
  `isLoaded() && isTracked()`, which is what `useSolveStatus.loaded` returns.
- **Hooks cannot live inside a `.map` callback**, so the `CollectionPanel` row
  had to be extracted into a `CollectionPuzzleRow` component; the row's `me`
  comparison is passed down as `meId` rather than read from context again.
- **The server's `seen` omits solved ids.** Anyone reading `UserProgress` must
  union `seen` and `solved` to get the opened set; persisting `resp.seen`
  verbatim into the local `seen` store makes every solved puzzle render a dot
  *and* a stamp. The union belongs in `refreshIfStale`, not in the card.
- **The first test in a `logic-pad-api` test file is flaky-ish** (pre-existing,
  unrelated to this feature): it pays cold-start cost (~1.6 s vs ~0.6 s for the
  rest) and `getSessionCookie` occasionally returns no session, surfacing as a
  `401` where `200` was expected. Re-run before chasing it — confirmed by
  stashing this feature's changes and observing the same first-test timing.
- **`POST /moderation/puzzle/:puzzleId/:action`**
  (`packages/api/src/routes/moderation.ts:710-738`) deletes all
  `solve_sessions` for a puzzle and decrements `users.solve_count`. A moderator
  unpublish therefore makes the affected users' local stamps stale until their
  next refresh (≥10 min). Accepted: cosmetic, self-healing, and not worth a
  push invalidation.
- **IndexedDB absence** (Firefox private mode, Safari ITP eviction): the tracker
  must still work in-memory for the session. Test by stubbing
  `indexedDB.open` to reject.
- **`/dev/puzzles`** fabricates ids from `pid`
  (`routes/(local)._layout.dev.puzzles.lazy.tsx:50-94`); they will never appear
  in `seen`, so without the `loaded` gate every row would show a dot.

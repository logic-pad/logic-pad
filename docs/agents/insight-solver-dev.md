# Insight Solver — Development Guide

Practical notes for working on the Insight Solver
(`packages/logic-core/src/data/solver/insight/`). Read
[`docs/insight-solver.md`](../insight-solver.md) first for the architecture
(lemmas, stores, proofs, worker protocol); this document covers the **dev
loop**, the invariants that are easy to violate, and what was recently built.

## Contents

- [Where things stand](#where-things-stand)
- [Dev workflow](#dev-workflow)
- [Verification: the dual-mode rule](#verification-the-dual-mode-rule)
- [Codebase invariants and gotchas](#codebase-invariants-and-gotchas)
- [Conventions](#conventions)
- [Work log](#work-log)
- [Appendix: regression corpus](#appendix-regression-corpus)

## Where things stand

Latest work: **off-by-X support for every number symbol**, through a new
`NumberSymbolStore` (details in the [work log](#work-log)). Previous session
landed as `47b0c52` (*Update agent handover*).

- **The official harness works in this checkout.** `references/dev_puzzles.json`
  is present (untracked; 3640 entries, 3025 rated). `bun run insight-eval` from
  `packages/logic-core` is the fastest regression signal and currently reaches
  **510/3025** before stopping.
- **The previous stopper, pid 15010, is solved.** It was a dart puzzle under
  "all numbers are off by 1": `complete-dart` read `dart.number` directly and so
  reported a false contradiction ("Dart at (1,4) sees only 0 opposite-colored
  cells…"). Darts now reason over both candidate values.
- **Current stopper: pid 15114** — a 4×10 grid with five viewpoints and *no*
  rules. The solver stalls with `(6,0)` and `(7,0)`/`(6,1)`/`(7,1)` left gray;
  `speculative-solve` reports it as a **0-step speculation**, so by the rule
  below this is a missing lemma rather than a brute-force gap. All four cells
  must be light, and the only nearby constraint is the viewpoint at `(8,3)`
  (number 3) whose slack reasoning has already been exhausted — a candidate for
  a cross-viewpoint or "remaining space" technique.
- **`speculative-solve` deliberately refuses 0-step speculations**
  (`speculativeSolve.ts:120`). When a hypothesis contradicts with *no* deduction
  in between, it logs `0-step speculative solve at (x,y)` and returns `false`,
  because such a case is always reachable by a real lemma. **Treat that log line
  as a missing-lemma report, not a bug.**
- Newest lemmas: `symbol-count-bounds` and `impossible-symbol-area-color`, both
  covering the `symbols_per_region` rule. Details in the [work log](#work-log).

## Dev workflow

Everything runs from `packages/logic-core` with throwaway scripts named
`scratch-*.ts` at the **package** root, deleted before finishing. Keep them
inside `packages/logic-core/` — a scratch file at the repo root makes eslint
fail with *"was not found by the project service"*.

### 1. Reproduce

Decode the `d=` parameter from the `?d=` URL the reporter pasted, dump the
grid, run the loop, and print the stuck state. Relative imports start at
`./src/`:

```ts
import { Compressor } from './src/data/serializer/compressor/allCompressors.js';
import { Serializer } from './src/data/serializer/allSerializers.js';
import InsightContext from './src/data/solver/insight/insightContext.js';
import allLemmas from './src/data/solver/insight/lemmas/allLemmas.js';
import { runLemmaLoop } from './src/data/solver/insight/lemmaLoop.js';

const puzzle = Serializer.parsePuzzle(await Compressor.decompress(d));
const context = new InsightContext(puzzle.grid.resetTiles());
runLemmaLoop(context, allLemmas.filter(l => l.isApplicable(context.grid)), {
  onLemmaSuccess: (l, nh) => {
    for (const h of nh) process.stdout.write(`[${l.id}] ${h.proof.root.description}\n`);
  },
});
```

Render grids with a `Record<Color, string>` map (`b`/`w`/`n`, uppercase for
`fixed`, `.` when `!exists`). `Color` is a **string** enum (`'dark'`/`'light'`/
`'gray'`), so never compare against numbers.

Always call `resetTiles()` for a from-scratch solve, and mirror what the
worker does (`validateGrid` first, `InsightError` caught separately from
real exceptions).

### 2. Introspect, don't guess

When a lemma fails to fire, dump the stores rather than reading code
speculatively. The three that matter:

- `context.regions.regions` — id, `color`, deduplicated `positions`, and
  `[...region.symbols]`. **`region.positions` contains duplicates** (one
  entry per cell of each area, so a 7-cell region reached by 7 areas has 49
  entries); always dedupe with
  `[...new Map(region.positions.map(p => [`${p.x},${p.y}`, p])).values()]`.
- `region.getRegionMap()` printed as `T`/`F`/`?`/`.` per cell — this is
  almost always where the bug is. `true` = in the region, `false` = provably
  not, `null` = still possible. A lemma that "should" fire usually has too
  few `null`s (over-constrained map) or too many (under-constrained).
- `context.regionSizes.getPossibilities(region)` — `null` means
  unconstrained, `[]` means contradictory.

For line-of-sight symbols (dart, viewpoint), print each ray as
`color@cell` chains so off-by-one and blocking bugs are obvious.

### 3. Instrument by monkey-patching, not editing

To see why a store-level lemma produces no tiles, wrap the store method in
the scratch script. Pure relational lemmas (`disconnect-incompatible-*`)
never touch `tileHistory`, so they look silent in the output:

```ts
const store = context.regions;
const original = store.addDisconnected.bind(store);
store.addDisconnected = (a, b, proof) => {
  const changed = original(a, b, proof);
  if (changed) process.stdout.write(`  [${proof.root.source}] ${proof.root.description}\n`);
  return changed;
};
```

The same trick works for auditing arguments (e.g. logging whether two
regions were actually adjacent when a size lemma fired).

### 4. Unit-test with synthetic grids

Build tiny grids rather than shrinking the reported puzzle:

```ts
new GridData(
  tiles[0].length, tiles.length,
  GridData.createTiles(tiles),        // 'b' 'w' 'n' '.', uppercase = fixed
  GridConnections.create(connections) // 'a' = merged with same letter, '.' = alone
).addSymbol(new LotusSymbol(2, 2, Orientation.Up))
```

Then call `new MyLemma().apply(context)` directly on a fresh
`InsightContext` and assert on `context.tileHistory[0].proof.root.description`.

Cover, for every lemma: the happy path, each early-return/skip branch, each
`throw this.error(...)` path, and the **merged-tile** variant (a deduction
that colors one cell must color the whole tile, and must skip tiles containing
a fixed cell **or any already-colored cell** — a mixed tile's color is already
determined, so recoloring it contradicts the cell it already has).

Watch out: a 1-row grid with `GridConnections.create(['aaa'])` is degenerate —
merged tiles spanning rows are the interesting case.

### 5. Verify, then clean up

Delete every `scratch-*.ts`, then run `bun run lint` and
`bunx --bun tsc --noEmit` from the repo root. Fix prettier complaints with
`bunx eslint --fix <files>` rather than by hand. Never run `bun build` in
`packages/logic-core` (the `typegen` step is extremely slow).

Timing is worth printing (`performance.now()` around each full solve) when a
change adds per-cell or per-pair work: the lemma loop restarts from scratch
after every deduction, so an O(cells²) lemma inside another O(cells²) lemma
gets expensive fast. The 18-puzzle corpus verifies in **both** modes in ~3.6 s
total (~60 ms for the largest single solve).

## Verification: the dual-mode rule

**Every fix must be verified in both solve modes, agreeing on the same final
grid.** Run each corpus puzzle twice:

- `completeSolve: true` — one `runLemmaLoop` over the whole solve (what
  `InsightSolver.solve()` does).
- `completeSolve: false`, repeated — one deduction per fresh `InsightContext`,
  fed back in (what the UI's hint button does).

```ts
let cur = start;
for (;;) {
  const res = worker(cur, false);           // stops after first tileHistory entry
  if (res.stalled || res.error) break;
  cur = Serializer.stringifyGrid(res.grid); // serialize round-trip, like the worker
  if (res.grid.isComplete()) break;
}
```

This is not busywork: **two separate bugs were only visible as a divergence
between the modes**, and both had the same root cause — state that accumulates
within one long-lived context but is absent from a fresh one:

1. `RegionStore.recompute()` replayed `connectionProofs` into the disjoint set
   *before* rekeying them to the current area ids, so after the first tile
   fill the unions were garbage. Step-by-step never noticed because each call
   re-keys against a grid that hasn't changed mid-run.
2. `addDisconnected` mutated the store without invalidating the `_regionMap` /
   `_regionGraph` caches on the `Region` objects, so a full solve kept using
   stale maps. Fixed with a `version` counter on `RegionStore` that both
   accessors check.

Corollary: when adding a lemma that mutates stores in place, ask "what cached
derived state does this invalidate?" Also, when a full solve *throws* but
step-by-step succeeds, suspect an unsound deduction whose evidence only
survives in accumulated proofs.

`bun run insight-eval` (from `packages/logic-core`) is the official regression
harness and **works in this checkout** — `references/dev_puzzles.json` is
present. It stops at the first failure, so it is the quickest way to see whether
a change advanced or regressed the frontier. Keep using the appendix corpus for
*targeted* technique fixtures: the harness reports only pass/fail, never which
technique a puzzle exercises.

## Codebase invariants and gotchas

Facts that cost real debugging time across sessions.

**Area ids are positional and renumber on every grid change.** `AreaStore`
assigns `AreaId = y * width + x` of the seed cell, so filling one tile shifts
every subsequent id. Anything keyed by area id (connection/disconnection
proofs) must be re-keyed against current areas *before* it is replayed into
the union-find. This is why `recompute()` re-keys `connectionProofs` first,
then unions, then re-keys `disconnectionProofs` (which depends on the set).

**Non-existent tiles are light.** `TileData.create('.')` returns
`{ exists: false, color: Color.Light }` — the color ternary falls through to
`Light` for any char that isn't `'n'`/`'b'`. So `grid.find(t => t.color ===
Color.Light)` can return a **hole**, and `regions.get(hole)` returns `null`.
Every seed/lookup scan must be `t.exists && t.color === ...`. This silently
disabled `connect-all-removes-disconnected-regions` on any grid with holes.

**`buildPhysicalDisconnections` must scan all ordered pairs.** Regions are
built in row-major order, so a gray region often has a *lower* id than the
solid region it sits next to. Iterating `j = i + 1..` with the flood fill
rooted at solid regions only ever flags gray regions that come *later*,
producing asymmetric deductions (bottom half colored, top half not). Use
`for (j = 0..; if (i === j) continue)` — the pair key goes into a `Set`, so
the `i+1` "optimization" buys nothing.

**Region maps must model both barriers and the 1-cell gap.** Two same-color
regions proven separate cannot merge, so they need an opposite-color cell
between them. In `buildRegionMap`, disconnected regions' cells *and the cells
orthogonally adjacent to a same-color determined one* must be barriers for the
**flood fill itself** (`iterateArea` predicate), not just post-pass
assignments — otherwise the fill walks straight through a proven-separate
region and marks everything beyond it `null`, inflating `maxComplete`. Cells
already `true` (the region's own) are never blocked. Getting this right is
what lets `complete-region-size` see that an area number has exactly enough
room.

**Merged tiles are atomic.** Coloring any cell must go through
`setColor`/`setOppositeColor` from `helper.ts` (they fan out via
`connections.getConnectedTiles`). Any lemma that inspects a cell's
**neighborhood** must likewise inspect the whole merged tile: a tile can touch
two regions via different cells while no single cell of it touches both, which
is exactly the case `separate-disconnected-regions` needs to force the tile
dark. Skip a tile containing any fixed cell — you cannot recolor it.
Deductions that count cells must group gray cells by merged tile (see
`completeDart`'s subset-sum over merged tiles, `breakBannedPattern`'s
`tileKey`, `colorViewpointSight`'s `visibleCount`).

**`isApplicable` gates on symbols *and* rules.** Several lemmas are driven by
`RegionSizeStore`, whose possibilities now come from both area number symbols
and `RegionAreaRule`. Any lemma reading `regionSizes` must accept either:

```ts
!!grid.findSymbol(s => s.id === areaNumberInstance.id) ||
!!grid.findRule(r => r.id === regionAreaInstance.id)
```

Four lemmas (`complete-region-size`, `forced-region-expansion`,
`disconnect-incompatible-region-sizes`, `impossible-region-color`) were
sequentially blind to rule-only puzzles this way. When adding a size-aware
lemma, copy that pair.

**Never read `.number` in a lemma.** Every symbol whose count an off-by-X rule
affects derives from `NumberSymbol` (dart, viewpoint, area number, house,
minesweeper, focus), and its printed number is only a *candidate*: under an
off-by-X rule it admits `n - x` and `n + x`. Read values through
`context.numbers` (`getPossibilities` / `minPossible` / `maxPossible`) and rule
candidates out with `eliminatePossibility`. `RegionSizeStore` keeps its own
area-number handling because it intersects several symbols into one region size;
`NumberSymbolStore` is strictly per-symbol.

**Who owns feasibility.** `NumberSymbolStore` deliberately does *not* call
`countTiles`: it expands the printed number into candidates and tracks
eliminations, nothing more. The lemmas own the counting rules, so each compares
candidates against what it can actually see and eliminates the rest. That split
is what keeps contradiction messages precise (`already sees 2 cells, which is
more than its number 1`) instead of a generic `no possible values remain`.
Consequently a lemma must handle the empty-candidate case itself, and when it
gates on an exact value it has to check that only one survives
(`minPossible() === maxPossible()`). Gates that hold across a range use the
extremes: completion against `maxPossible`, exhaustion against `minPossible`,
tolerable loss against `possible - minPossible`, excess against `maxPossible`.

**`symbols_per_region` bounds in *both* directions — filter by comparison.**
Unlike `region_area`, it has all three comparisons, and which one can produce a
contradiction depends on the reasoning:

- "too many symbols" (merging, capping): only `Equal`/`AtMost` bound from
  above, so filter out `AtLeast` — `disconnect-incompatible-symbol-counts`.
- "too few symbols" (forcing membership, coloring): only `Equal`/`AtLeast`
  bound from below, so filter out `AtMost` — `symbol-count-bounds`' lower
  branch and `impossible-symbol-area-color`.

A new symbol-count lemma must pick the filter matching its direction; getting
this backwards makes the lemma silently fire on rules it cannot justify.

**A `symbols_per_region` rule with `color: Gray` is not a wildcard.** It
constrains the *current* undecided blob (its own `validateGrid` floods gray
together with the seeded color), so it says nothing about which final color a
cell may take. Color-deducing and membership-forcing lemmas must skip gray
rules; `disconnect-incompatible-symbol-counts` and `impossible-symbol-area-color`
both do.

**Count symbols through `symbolCorners()` in `helper.ts`.** A symbol at a
half-integer coordinate touches up to four cells, and the rule counts it once
per area it touches, so membership must OR over `floor`/`ceil` of both axes
rather than reading a single cell. Both symbol-count lemmas share this helper —
don't re-derive the corner set.

**Speculation is a crutch, not a fix.** `speculative-solve` is registered last
and will brute-force past gaps. When it fires on a puzzle that "should" be
solvable by insight, the missing lemma is the real bug — but confirm the
deduction is genuinely human-visible before adding one. One earlier session hit
a puzzle reported as "the final two cells are ambiguous"; the truth was
a missing upper-bound check in `color-viewpoint-sight`. Push back with
evidence, and verify by checking whether a deduction the reporter describes
is expressible in the current lemma set. The lemma also refuses 0-step
speculations outright (see [Where things stand](#where-things-stand)), so a
puzzle that needs one stalls instead of being brute-forced — that stall *is*
the signal.

## Conventions

**Proof difficulty** as used across the lemmas:

| Level | Meaning |
| --- | --- |
| 0 | speculative wrapper (`speculative-solve`'s "if cell X is dark, then:") |
| 1 | direct local count / immediate consequence of one symbol |
| 2 | counting with propagation, subset reasoning, involution, store-level separation |
| 3 | structural: region-graph bottlenecks, articulation points, multi-step expansion |
| 4 | `speculative-solve`'s conclusion |

**Descriptions** are user-facing. Use `cell()` for positions and `area()` for
region representatives. `cell()` floors fractional coordinates and expands
subtile positions into their four corners, so for symbols at half-integer
coordinates print `` `(${symbol.x},${symbol.y})` `` manually. Pluralize
("1 cell" / "2 cells") — `completeDart.ts` has a `plural()` helper for this.
Name the deduction's *subject* in the sentence so it reads correctly when the
lemma generalizes (`Area number at …` vs `Cell at …` vs `Region at …`,
depending on whether the constraint came from a symbol or a rule). Never print
a bare bracketed number list such as `[2,2]`: sitting next to `cell()` output
it reads as a coordinate for an unrelated tile. Spell it out — `of sizes 2 and
2` — with a `list()` helper.

**Errors** (`throw this.error(...)`) mean "this grid is in an invalid state",
which marks the puzzle unsolvable — reserve them for genuine contradictions
(already-sees-too-many, can-never-see-enough, no-possible-size, region
cannot be connected), never for "my lemma has nothing to say".

**Renames.** When a lemma outgrows its name, rename the file, class, and `id`,
and update `allLemmas.ts`; grep for the old id first (nothing outside
`allLemmas.ts` references lemma ids, and `docs/insight-solver.md` mentions
them only generically). Done so far: `complete-area-number` →
`complete-region-size`, `impossible-area-number-color` →
`impossible-region-color`.

**PowerShell.** Prefer the write/edit tools over here-strings for scratch
scripts: `@'...'@` blocks mangle `$`, backticks, and `?` (the ternary
`cond ? 'a' : 'b'` was corrupted twice). Use `$(...)` subexpressions and
`-LiteralPath` throughout.

## Work log

### Latest session — off-by-X for every number symbol

New shared infrastructure:

| Piece | File | Role |
| --- | --- | --- |
| `NumberSymbolStore` | `stores/numberSymbolStore.ts` | Per-symbol counterpart of `RegionSizeStore`: expands a printed number into the candidates an off-by-X rule allows (`n` alone, or `n - x` / `n + x` clamped to `[0, existing cells]`), tracks eliminations with their proofs, and exposes `getPossibilities` / `minPossible` / `maxPossible` / `eliminatePossibility`. Keyed by **symbol object identity**, which is stable across a solve because only tiles are replaced (`grid.copyWith({ tiles }, false, false)` leaves the symbol array alone). Wired into `InsightContext` as `context.numbers`, with `copy()` and `setTiles()` handling like the other stores. |

Reworked lemmas — all three previously read `.number` directly:

- **`complete-dart`** now runs its merged-tile subset-sum **once per candidate
  value**. A candidate with no satisfying combination is eliminated through the
  store; a group is colored only when every surviving candidate agrees on it
  (in none of the combinations → the dart's color, in all of them → opposite).
  Eliminations count as progress and return `true` on their own, so the loop
  restarts and the next pass classifies against the narrowed candidate set.
  With a single candidate this reproduces the old behavior and its exact proof
  wording.
- **`complete-viewpoint`** eliminates candidates outside `[completed, possible]`
  first, then gates: the capping rule needs `completed === maxPossible`, the
  fill-everything rule needs `possible === minPossible`, and the single-direction
  expansion rule requires `minPossible === maxPossible` because it computes an
  exact run length.
- **`color-viewpoint-sight`** uses the extremes for the same reason: losing a
  cell is intolerable when it breaks even the smallest candidate
  (`slack = possible - minPossible`), and a coloring is excessive only when it
  exceeds the largest (`revealed > maxPossible`).

Gotchas hit while building these:

| Symptom | Cause | Resolution |
| --- | --- | --- |
| Harness stopped at pid 15010 with `Dart at (1,4) sees only 0 opposite-colored cells…` | `complete-dart` treated the printed number as the only value, so a dart whose true count was `number - 1` looked contradictory | per-candidate subset-sum + eliminations |
| Verification script flagged `letters 557` as a regression | that corpus entry carries **no embedded solution**, and `correct` defaulted to `false` | a missing solution means nothing to compare; only assert `colorEquals` when `puzzle.solution` exists |
| A fixture expected candidates `3` and `5` but only `3` survived | the store clamps `n + x` to the count of existing tiles, so the single-candidate legacy path threw instead | size the fixture above the clamp, or assert the clamped candidate list |
| Expected an "already sees more than its number" throw and got none | with `opposite === number` the target is `0`, which is a perfectly feasible combination | the contradiction needs `opposite > number` |

The durable lesson: relational progress (an elimination) is still progress — a
lemma that only narrows candidate values must return `true` without touching
tiles, and the loop's restart-from-the-top behavior is what lets the next pass
draw conclusions from the narrowed set.

### Previous session — symbols per area (`2940238`)

New lemmas:

| Id | File | Technique |
| --- | --- | --- |
| `symbol-count-bounds` | `symbolCountBounds.ts` | Both directions of a `symbols_per_region` bound, expressed as region membership. Lower (`Equal`/`AtLeast`): when a region's *reachable* symbol count equals the requirement, every reachable symbol must join → `addConnected`. Upper (`Equal`/`AtMost`): when the region already holds its allowance, remaining reachable symbols stay out → `addDisconnected`. Membership is read off `region.getRegionMap()`: `true` = inside, `!== false` = reachable. Purely relational, so it never appears in `tileHistory`. |
| `impossible-symbol-area-color` | `impossibleSymbolAreaColor.ts` | The dual of the lower branch, expressed as a color. Flood the area a gray cell *would* form if colored C (merged tiles atomic) and count symbols optimistically, assuming every gray cell on the flood takes C. Fewer than the minimum ⇒ C impossible ⇒ opposite color. Both colors impossible ⇒ `throw this.error(...)`. |

Shared infrastructure: `symbolCorners()` in `helper.ts`, extracted from a
duplicated inline copy and now used by both lemmas.

Gotchas hit while building these, roughly in order of what they cost:

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `ReferenceError: cell is not defined` mid-scratch-run | An import edit dropped `cell` from `symbolCountBounds` while a description still used it | Re-add the import; run lint/`tsc` *before* executing a lemma for the first time |
| Lemma concluded "cannot be light → must be dark" on a tile that was already partly light | Merged-tile guard skipped only **fixed** members, not already-colored ones | Skip any tile with a fixed **or** non-gray member (see §4) |
| Test asserted a gray cell beside the symbol was unfillable | Bad premise: the flood legitimately reaches the symbol through the adjacent same-color cell | A walled-off premise needs opposite-color neighbors on *both* sides (this is what the report puzzle's `(3,0)` looks like) |
| `GridConnections.create(['ab'])` merged nothing | Different letters mean *separate* tiles; merging requires the **same** letter | Use `['aa']`; confirm with `connections.getConnectedTiles` before trusting a fixture |
| Hand-rolled dual-mode driver reported `agree=false` on every puzzle | Its step hook returned `false` (halt) for relational-only successes, which the real worker treats as "continue to the next lemma" | Mirror `insightWorker.ts` exactly: halt only when `newHistory.length > 0` |

That last one generalises: **a hand-rolled step driver must replicate the
worker's `onLemmaSuccess` semantics**, or it manufactures divergence that does
not exist in the product.

### Earlier session — lotus, symbol counts, viewpoint sight

New lemmas:

| Id | File | Technique |
| --- | --- | --- |
| `complete-lotus` | `completeLotus.ts` | Reflection symmetry of a region: mirror must exist and belong to the region; gray cell mirrors a colored one → take that color; involution (mirror in region → join it); mirror outside region → cannot join. Multiple lotuses per region allowed (unlike galaxies) as long as parallel axes coincide. |
| `disconnect-incompatible-symbol-counts` | `disconnectIncompatibleSymbolCounts.ts` | Merging two regions whose combined `necessaryForCompletion` symbol count exceeds a `symbols_per_region` limit (`Equal`/`AtMost` only) → disconnect. Union is deduplicated so a subtile symbol straddling both counts once; two gray regions are never separated. |
| `color-viewpoint-sight` | `colorViewpointSight.ts` | Two-sided line-of-sight bound for viewpoints: a gray cell hiding more than the slack must match the viewpoint; a gray cell whose same-color extension would reveal more than the number must be opposite. Merge-aware. |

Shared infrastructure: `types/symmetry.ts` — isometries in doubled
coordinates (so axes through cell corners are exact), with composition, group
closure (`generateGroup`, detecting translations ⇒ infinite), and
`symmetriesOf(symbol)` for galaxy/lotus. `complete-lotus` and
`disconnect-incompatible-symmetries` both use it; the latter was rewritten
from galaxy-only to a unified check that rejects a merge when the generated
group contains a translation, or when a cell's image is off-grid, non-existent,
or outside both regions.

Reworked: `complete-dart` treats merged tiles as subset-sum units
(target = number − opposite-colored) and classifies **every** group by its
membership in the combinations that reach the target: in none → the dart's
color, in all → opposite-colored, in some → deferred to a later step. Prefix
and suffix DP tables answer the two zero-tests, so one mechanism replaces the
earlier cascade (oversized early-exit, "leaves too few cells" early-exit,
unique-selection). Wrap-around grids are skipped.

Bugs fixed, with root causes:

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Full solve one tile short; step-by-step fine | `recompute()` replayed stale area-id proofs into the union-find | Re-key connection proofs before unioning |
| `No possible sizes remain for region [2,1]` at solve start | `impossible-*-color` treated an empty possibility set as an error instead of the contradiction it was looking for | Detect `possibilities.length === 0` and color the opposite way |
| `connect-all-removes-disconnected-regions` colored the bottom half but not the top | `buildPhysicalDisconnections` scanned only `j > i`, missing gray regions with lower ids than the solid one | Scan all `i ≠ j` pairs |
| Same lemma inert on grids with holes | `grid.find(t => t.color === color)` matched a non-existent (light) cell | Add `t.exists &&` |
| `break-banned-pattern` missed a pattern broken by one merged tile | Each gray cell of the pattern counted as a separate mismatch | Group mismatches by canonical `tileKey` |
| Unsound size disconnection, only in full solves | `countA + countB + 1 > maxA` assumed a merge always costs a cell | Charge the extra cell only when the regions are not already adjacent |
| Stale region maps in long-lived contexts | `Region._regionMap`/`_regionGraph` never invalidated by `addConnected`/`addDisconnected` | `RegionStore.version` counter checked by both accessors |
| Over-generous region maps blocked `complete-region-size` | Flood fill ran before disconnections were consulted | Barrier set (disconnected cells + same-color gap) applied to the `iterateArea` predicate |
| `forced-region-expansion` blind to narrow corridors | All removable articulation points deleted at once, shredding corridors and leaving patches with multiple exits | Evaluate one bottleneck at a time; skip if the region's own cells would split |
| Size lemmas inert on rule-only puzzles | `isApplicable` checked only for area-number symbols | Also accept `RegionAreaRule` |
| `(5,1)`-style "would merge two constrained regions" unseen | Gray-cell hypotheses gated on a `region_area` rule existing | Test both colors, pre-filtered by `colorMatters` |

## Appendix: regression corpus

Nineteen puzzles, each verified to solve completely with `validateGrid(...).final
=== 'satisfied'` in **both** modes. The label notes the primary technique each
one exercises; several were the repro for a bug above. Numbered labels carry the
puzzle's `pid` from `dev_puzzles.json`; the unnumbered ones were supplied
directly as report links. Note that not every entry carries an embedded
solution, so "correct" can only be asserted where one exists.

```ts
const puzzles: [string, string][] = [
  // off_by_x + darts — complete-dart reasons over both candidate values
  ['dart off-by-x 15010', 'dfl_ddJRa8IwEAfwrxLuOWBr9SWQh7GxIQiTKRSGUJI21WBMJL0Y67rvPioTulFfj9___hxcUnwBajQKGCzeF2QVrlejSDpP0gQo7LyugMH8Mu82cxbzPI95jDLGKGWeSynjbdY9p6z77NaV8EgvPKUtT6gNR6k8T6jzWlkUqJ3llYuW_bLpkKWPGM-GbPqI8YS2PB0v9Xq3x7ub0ZZPx1uNqnG4Lhtv_bOuv3U27sJpeOkd8ewByoZo9g91H6WzVpVYCGNo6YzzvBL-wFxdF7ItLvdgChQqXde6DAZbYCkFo-0BGAAFEXDvPDBYBit8uSdrDJV2TZ9RTen1qa8DBmsUGBpGjD6rrd3aRUPOwmpjBCPow222ErhnJHfeVGRCngKGoyWvwpiGTMiL0Kb9faYJWbqdLt-8rorbY_XpjRfaENmiahhJKEng-wc='],
  // separate-disconnected-regions across a merged tile straddling two letter regions
  ['letters merged 1600', 'dfl_XZBta8IwEMe_ynGvQ-wUBwb6IulgCMJkCoUhSNpGDQvtSC_Wuu67j6iFsePuz93vHl5csv9GsuQMCly-LWEdrldnYDZPpsjw6G2FAheX-bBdiLzriiLvot6kiFF0XV5Ev-ejdUO2EFxKpTjnXCqZZVxKLhWXseZcZTGJ7ew2o4aPYeMMkfHskiasTxN2L1MpRp7O_3I18kv6zPp0-n_-cWc2cjW8I8PKHg62DI56FE8Mna0_USAy1IFOjUeBq1BrX55gQ6GyTRt3TFt6-0W2qVHghjSFVoCzZ7Ord_WyhbOurXNaAPlwY2tNJwF5410FE1iF0tQEuSbjW5jAi7auf7x6AqvmaMtXb6t9fHvc3nptHRQ9mVZAwiDBn18='],
  // complete-dart: a merged tile in no valid combination (no speculation needed)
  ['dart combos 1550', 'dfl_jdJda8IwFAbgv3I416HWKiqBXrQbG4IwmUJhCJJ-aMNiOtITY13330eLAxkr7L15SXjOuTr-_hNJkiqQ4_JlCWt7vaoCJv4sQIZHI3PkuLjM2-2Ce17Sx7sl8VLnXOoSL-3iEs-lLnX927m-u3Ltw5x7A4miqK84iruO47h9aze5MMQuYcCa0GfantLChFNWGVloEiQrHeaV0_zGJvdsMsTC2T0Lhlg4v2f-EAt91oTB39uMPJZ076b_dLMfN_7tSmpfkWEuDweZWUUN8jFDJfU7ckSGwlJZGeS4slqYrIQN2VxWdTdT1JmRH90m5LghQbbmoOS52OmdXtZwFloqJTiQsf3fWlDJIamMymEEkSV70vAklKphBI9CquZ2JSNYVUeZPRuZ77uL6Ya3RkgFaUNFzcFn4OPXNw=='],
  // upper-bound line-of-sight (color-viewpoint-sight forceBlocked)
  ['viewpoint cap 1500', 'dfl_dZLRasIwFIZfJZzrgK1alUCuJgxBmKxCYAjStFEPy1JJE2Nd9-6jZQUn9iJwko8v_PycaP8NDp1WwGD1tiIbf7tpRcaLRQIUjhYLYDC_zpvtnIkghJRCShmCCFIEKYUIMnSnu7VzkDK0g5CieYlZ89GkF1ThXKJx9MojWvOIGv8lleVTdo8m9yj5h2ZD1pUntObxcyumNR_3aPxo9cjyyWMMPnmO2g-nQzF6pCyPHy2ePE_YtjEbamMIdW30iI-bd6BQ4OGAudeuBhZT0Gg-gQFQyLw7lRYYrL3JbH4iqfMFllXrqCq3eHZYGmCQusz5ihGNF7UzO7OqyCUzqHXGiLO-e9tk7sSIKK0uyIikyiqjyFJpf1RkRJYZ6vpvgUZkXR4xf7VY7Ntlau2tzVATWTtVMRJREsHPLw=='],
  // forced-region-expansion (single-bottleneck corridors)
  ['fre corridor 1450', 'dfl_XdHbasMwDAbgVxG6NjRJDwOBb7rBKBRW1oJhFIqduK2Z5wzHbpIue_eRbYE2IF3o4xcIlBy-MJhgNRKuXlawider1ZA9JBkyPHlTIOGimXe7BdWiVn0va6FqVau-hBKqFmqpRPeYUvfWbV38UNqzhqes5Qn7G_mcBufzW58N3vCMtTwd51nDZ7c-yk8Hz-7zg_OU7u6ZjfOs4dNbX9zfOThPu1dkWJjj0eTRhhYpZWiNe0dCZChjOJceCdfRSZ-fYRtiYcqq39FV7s1nMKVDwm2QIVYE1lz03u3dqoKLdMZaSRB8_LWNDGcCUXpbwATWMdcugJBB-wom8CSNbf_fNIF1eTL5szfFoX9Zv73z0lhQbdAVQcIgwe8f'],
  // impossible-region-color on pure area numbers
  ['impossible-color 1400', 'dfl_VZBRawIxEIT_yrLPAT3taQnkqQURhEqVHhRBkkvUxTQpuUQ9e_3vJbYHdVnY2W-YlxluvzBStAY5zl_msEzXqzVQPI5KZLgPpJHj9DLp1lN-zqOUUmelqizzqkpV-WTnZldnpbqngnfv3cqlD2UCu4iStaJgv6-Y8J6LgrVi3POy5xcx_s8f7nnZ81H3GsyevNvKYCSrvfVBaBmOrKGrESNkqGm3ozrZ2CIvGFpyR-SIDGWKBx-Q4yI5GeoDrGLS5JucMU0d6DOSd8hxFWVMDQdLJ7NxGzdv4CQdWSs5xJBubCnjgUPlg9UwgDcTtHQRZtY4GMCzJNv-1TqAhd9TPQukt7niHF4HSRZUG03DYYjfPw=='],
  // region_area rule + viewpoints (isApplicable generalization)
  ['viewpoint region-area 1350', 'dfl_bdFfa8IwFAXwrxLuc0DrfwJ9mjAEYbIKhSGUpL3Wi1kiaWKs67770DnQIfft_Dj35fSLL_DkNYKAxduCrcL5rJEls0ECHGpHFQiYnSbdeiZUjHmMUakY1fViVLmKeVQqj_lVVX6BX4vdSyK6jy47EsaDJeP5KR3yNu1zEz4VunQi7mnE23TwnKb3NBb_Hw7_aPhA43t6bCW8TUfPW6N7mnbvpTUGS19IrXlptXWppnrnhcOarCmkQ3nLK-n2vKEzpgPgUNF2S2XQvgWRcNBk9iAAOMjgd9aBgGUw0pU7lvlQkW0uHWxKRwdP1oCAzEsfGsE0HXFjNmbRsKM0pLUUzLtwzVbS7wTLrdMV67EMHRpkc9ShRtZjc0m6vU3aY0tbU_nqqCou817aaydJM9V6bATrw_cP'],
  // symbols_per_region (eq) — disconnect-incompatible-symbol-counts
  ['symbol-count 1300', 'dfl_ddHBSgMxEIDhVwlzHmi3Vi2BnBSkUFCssCDCkmRjdzBNajYxG13fXbbWS8G5_R8zp5k3XxApWgMc1vdr9pA-P61h1apaAMIuUAscVsPV-LTiWR2nzqrOOauc62NnderfVGqKScabio_P49alvTIBB3GNRczxN8WS_7lYYBHVueMgKixi8c_-xbnjIOZYxPLccRBLLOLyz5fjo_bOGR0baS1qb30QrQxvvC975W3fHExogtmRd6h9clFUpy1Luy6i9vuDDNR7J8w7ILT0-ko62ViAVwiW3BtwAASZYucDcNgkJ4Pu2Damlnw_3ZheBzpE8g44bKOMqefM0od5cS9u3bMP6chayVkM6WgPMnac1T7Yls3YtpNtYTXZNns_wa0kW07Pm7GN35G-C9Q20yOn86cgyTJVouk5m8P3Dw=='],
  // connect_all on a grid with holes (the exists guard)
  ['connect-all 1250', 'dfl_XZFBawIxEIX_SpjzEl0vQsBD0oIIQqVKF4ogyW50gyEp2axb7fa_l0nWSwMzvPneG3KY-ekHoolWA4PN24bs-sfDalIulwso4BJMAwzK8rucj4eyZJRSqpRKhRJFkkrRoRIZVgO-nFSUDjlJqydUmEhwUAOdIJoJigpZkuPL9CXnHFuysbCh5HlOkexzgSbPZJpwQfAMKRc8-xmJ5zYXYvwc9-N77Z3TdTxJa4vaWx9WjQxX9h-HlTWXNkIBjTmfTd3beAdWFmCNuwIDKED2sfUBGGx7J0Pdkn3sG-M73NFdHcxXNN4Bg32Use8Yseamj-7oNh25SWeslYzE0Ce2k7FlpPLBNmRGPnRopItkbbUjM_Iqjb1Pp5uRrb-Yeh1Mc8Iz4vIhSGOJukfdMTKH3z8='],
  // region_area (dark = 4) — complete-region-size on rules
  ['region-area 1200', 'dfl_LZBRa8IwFIX_SriCT0WtOjoiPkzHhiBMVBiIUJI2thezRNLEq67776OtcODjfHBezij9BY9eK-Cw-lqxTXg8tGJxEo8ggsJhDhySW1LvE05ECyJJkhaLFtRCUiOJpOxKEzkgokG9jHl9qHf1VgqTXoT3ypnoyfnkNu734vF0tp_0ey-vMyIyZDq1jFvVlUOHXYctz6wxKvOp0DrKrLZurrEoPXeqQGtS4ZR4-ly4c1ThQ82nEEGOpxNmQfs78DgCjeYMHCACEXxpHXBYByNcVrKdDznaqtmoKnN48WgNcNh54UPFmcarOpqjWVXsKgxqLTjzLrRuI3zJ2bd1OmdD9hZ8-DHsQ2hdsSF7F6jvz4-HbG0LzD4d5mnzdzPeO4GaybtXFWcj-PsH'],
  // ban_pattern + merged tiles — break-banned-pattern
  ['ban-pattern 1150', 'dfl_jVFdi8IwEPwrYQWfCtpyFon4kKRwCMKJCoIIJU2jBkMiaeLX9f77kdb3u92BYWeZYWHH5Td45bUEDIuvBVqF10tLlE6mE0jg5FQNGPJH3m5zXHV1v3eoOsSquqZxR2nLckwIJYQy1oEQRgihtCgIYZQUlLE4tvt2064rbsor9146k7x5nj2y4SDNPmbbbDiYTGcxtxdY2gn9sO9p09Ma_ycqXvtX1GyNhTVGCl9yrRNhtXXzmrsLJFCr41GJoP0TcJqAVuYCGCABHvzZOsCwDIY7cUYbH2plm-iRjXDq6pU1gGHjuQ8NRlrd5MEczKJBN26U1hwj70Knrbg_Y7SzTtdohJZBSOPRjnvpGjRCBVf6-f7SCC3tSYlPp-oyfiy6t44rjaqnlw1G4wSl8PML'],
  // connect_all asymmetry (physicalDisconnections pair order)
  ['connect-all 1100', 'dfl_jZFBawIxEIX_yjCCpwVN0VoiniyIIFRcaUCEJdmNGgyJZCeu2u1_L-vupaf2MHwzj5nHwBtmX0iGrEaOy48lrOPjYTWw8SvDBI_BFMhxcpvU2wmvKqFEVXUQQijVlKpU1wjxe6WeM17v6rTeKOmyiyTSwSUdZ6Mb6_fYy2i6HfV747epUkq1wpw9hXbYtUhbbPh_rJoP_rKabnjundM5ZdLaJPfWh1khwxkTLMzhYPJo6Y6cJWiNOyNHTFBGOvmAHFfRyZCfIKVYGF82N7rMg7mQ8Q45piQplhysueq927tlCVfpjLWSA4X41NaSThyED7aAAXzqUEhHsLDawQDepbH3Lo0BrPzR5ItgiqxJpjneBmksqDvpksMQv38A'],
  // region-map gap barriers + area-number 6 needing exactly 6 cells
  ['gap puzzle 1050', 'dfl_XdBBa8JAEAXgvzLMeYmJTRUGcmpBBKFSpQtFkE2ymqHbTdnsusam_71Y9VBvMx_vXV66_UbP3mgknL_MYRlOJ6Mhy6ePKHDvuEbC_Dgd1jnJUsaYJLFMEhljLOXljlFGOTxlNLwPKxs-S-3EsUhFX6Ti8hZjunnxIPpifPOc_uXze7_mJzefDK8osObdjqtgfI-UCTRsP5AQBargm9Yh4SJY5aoGVj7U3Hbnju4qx1-eW4uEK6986AgMH_TGbuy8g4OybIwi8C782VL5hkC2ztQwgjftamU9zIy2MIJnxaa_bjWCRbvnaua43p53O5fXTrGBsve6I0gFZPjzCw=='],
  // unsound adjacent-merge disconnection (dual-mode divergence)
  ['area numbers 990', 'dfl_hdJda8IwFAbgvxLOdcB-KGqgVxsMQZisgjCEkjaxPSwmLk2sdd1_H7rpLDgGISEP73tykyD7AIdOSWAwe56RhT8elSTj6QQolBYFMBgdRt1yxPK8ua5V05zP8949hKx77VLtt7m09JBEtE0C-n1NQnb1-NbjXw9om4R38tGtD_seXXzcnxNfPOrn4ztzTvnhnXfDPzzqefdSt9vcqDrbSZtZWaLRtDBeuySkhVHGJoLbN1qY7Y5brI1O5Dv7t6OwrFy_BBQEbjZYeOVaYCEF7l1lLDCYe81tUZHUeYGmPiVlXVjcOTQaGKSOO18zonAv13qtZzXZc41KcUac9WdbcFcxsjJWCTIgacVFS1aoRGPMCR45qvbnXwzI3JRYPFkU2Xg6ObWXlqMieetkzUgAn18='],
  // empty-possibility contradiction at solve start
  ['area numbers 798', 'dfl_hdLRasIwFAbgVwnnOmBrFTWQqw2GIExWQRhCSdvYHoyJSxPbuu7dh87CKoxBSMjH-f_cJEg-waFTEhgsX5dk7S8XJclsMQcKhcUcGEybabeZsjSt-1Vv6_p23vbuKWTdexdrf0ylpQ0f05YH9OfKQ9Y7j3571HvDA9ry8HH-3tM7nwx93Pts2BP1Ph7OR4899_nJ47u04eEfPh5491a1x9SoKjlJm1hZoNE0M147HtLMKGN5LuyBZuZ4EhYro7n8YP9luMKidMMQUMhxv8fMK9cCCyko1AdgABSEd6WxwGDltbBZSWLnczTVNSOrzOLJodHAIHbC-YoRhWe50zu9rMhZaFRKMOKsv9lauJKRrbEqJyMSlyJvyRZVXhtzhWeBqr3_kBFZmQKzF4t5MlvMr-mNFahI2jpZMRLA1zc='],
  // letters + bottleneck (stale-proof self-disconnection regression)
  ['letters 557', 'dfl_bdBNa8MwDAbgvyJ0NiTZYgqGHPoBIxBYWQqBUShe4jYC4wxHLk2X_ffRLts6qNBFD690ULz7QCa2BhXmzzmsw_lsDUg5Q4EHTw0qlCc5bqSqnHOLa081DdW4TNT4OpbWMBsvTlkshiwW32M2V7-e3vrizx_EkCU_vvzvj3fyl_vpnXx66_PxBQU2tN9THSwPqBKBOnDbeVRYBKd93ULJoaGuvyRNX3t6Z-ocKixZc-gVWDqardu6vIejdmStVsA-XG2tuVVQdd42EEERauMYKs3G9xDBSpMdpndGUHQHqp88NTspZ5fljddk4W1g0yuI8fML'],
  // symbols_per_region (eq, both colors) — symbol-count-bounds + impossible-symbol-area-color
  ['symbols per area', 'dfl_hZDNasJAFEZfZbjrARONm4FZaEuLIFSqIBQhTJIxuXgzY-fHGJu-e1FbaFeFb3MOnM2X5B8QMJAGAYuXBVvFy4U0S7PpeAocaocVCMjO2bDJRLHtuqLouuvm3bwYHlIxvA1rE9tCO36WCe_lhN9RTsWPl-PffiJIh3DzKe9lwu8oZ8Or79vCks-P2uVO12gNL200Qaa8tGSdrJQ78NK2R-XQWyP1u_ivkYR1E_5GwKHC_R7LSKEHkXIgNAcQABxUDI11IGAZjXJlw9YhVmj9tdG-dHgMaA0IWAcVoheM8KR3ZmcWnp2UQSIlWHDx5lYqNIJtraOKjdgshtga9qSIPBuxR4XUfx8-YktbY_nssMpv51_rjVNIrOiD9oIlnCXw-QU='],
  // single lotus, vertical axis
  ['lotus daily', 'dfl_NY9Ra8IwFIX_yuU-h9rKFAz4YDcYgjBZhcAQJG2qvSwkkt4Y67r_Pjq283I4H5wDJz99IRPbFiVu37awj4-HbWFV5CjwEsigxOV9MR6WUqWkVCpTWataJaVUmrxMKU1pfH6S2b-yzWb8GCvrOfbivp5nCzGs58IHah1rJu_W8Tq-o0BD5zM10fKAshBoyX2iRBSoI3c-oMRddDo0HVQcDfl-6rR9E-g6zaDEijXHXoKlW3t0R7ft4aYdWaslcIi_bK-5k6B8sAZmUHXaDKDImuT9BF402eHv-Qx2_kLNayBzWhX51D4ETRbqgdteQi6gwO8f'],
  // two lotuses with non-parallel axes (symmetry group)
  ['two lotuses', 'dfl_VZDNSgMxFIVf5XLXkTaohQZmUwUpFCxOISCFkkzSzsWQlMxNp1PHd5cRXbg7fOdnceaHT2Ti4FHh-nUN23K7BQ9LKVHgKZNDhYvr47hbqF5bbfVKa9tr3VvdW2v1pPp-pfX4JNX4PtYhcenEtZJiqKRImXxkw5RiFfyR1Z_9IIbq_p9dzndTYnxDgY6OR2pK4AGVFBgofqBCFGgKtymjwk2JJjct1FwcpW7q-K7JdJ62UGHNhkunINDF7-M-rju4mEghGAWcyw_bGm4V6JSDgxnUrXEDaAquT2kCz4bC8PvHDDbpRM1LJndYSjm1d9lQADuw7xTMBUj8-gY='],
];
```

Open any of them in the editor with `http://localhost:5173/create?loader=visible&d=<param>`
(to see the solved state) or `/solve?d=<param>`.

# The Insight Solver

This document describes the architecture of the **Insight Solver**, located at
`packages/logic-core/src/data/solver/insight/`.

The Insight Solver is an insight-driven solver: instead of brute-force
backtracking, it solves puzzles the way a human would — by iteratively
applying logical deduction rules called **lemmas**. Because every deduction
is justified, the solver can emit **proofs** (human-readable explanations)
and a **difficulty rating** for the deductions it used. It runs in a Web
Worker so long solves never block the UI.

## File map

```
insight/
  insightSolver.ts    Solver subclass: public API, spawns and talks to the worker
  insightWorker.ts    Worker entry point: message protocol + main solve loop
  insightContext.ts   InsightContext: central mutable state for one solve
  helper.ts           Tile/color helpers shared by lemmas
  lemmas/             InsightLemma base class + the concrete deduction rules
  stores/             Derived-state trackers (areas, regions, number symbols, ...)
  types/              Proof/ProofNode and InsightError
```

The solver conforms to the `Solver` base class
(`packages/logic-core/src/data/solver/solver.ts`), which defines the common
contract: `id`, `author`, `description`, `supportsCancellation`, `solve()`
(async generator of `GridData | null`), `isEnvironmentSupported()`, and
`isGridSupported()`/`isInstructionSupported()` used by the UI to enable the
Solve button. Other solvers (`backtrack`, `cspuz`, `universal`, `auto`) share
this contract and are registered in `data/solver/allSolvers.ts`.

## Layers

```
UI ──> InsightSolver (main thread)
         │  postMessage({ serialized grid, options })
         ▼
       InsightWorker (worker thread)
         │  creates InsightContext(grid)
         │  runs lemmas in a loop until no more progress
         ▼
       Lemmas ──read/write──> InsightContext ──> Stores (derived state)
```

### InsightSolver (main thread)

`insightSolver.ts` exposes two entry points:

- **`solve(grid, abortSignal)`** — the async generator required by the
  `Solver` contract. Resets tiles, runs a complete solve, and yields the
  solved grid (`null` if unsolvable).
- **`process(grid, options)`** — the full-featured API used when proofs or
  progress reporting are needed. Options:
  - `completeSolve`: solve to completion vs. stop after the first deduction
    (used for step-by-step hints)
  - `reportProof`: include proof trees in the response
  - `onProgress(progress, total)`: progress callback
  - `abortSignal`: terminates the worker mid-solve

Grids cross the worker boundary only as **serialized strings**
(`Serializer.stringifyGrid` / `parseGrid`), never as live objects.

### InsightWorker (worker thread)

`insightWorker.ts` owns the message protocol and the main loop:

- **Request** (`SolveRequest`): `{ data, completeSolve, reportProof,
  reportProgress }`
- **Responses** (`Response` union):
  - `{ type: 'solve', data, proofs? }` where `data` is a serialized grid,
    `null` (unsolvable), or `undefined` (no progress / already solved)
  - `{ type: 'progress', progress, total }`
  - `{ type: 'error', message }`

Main loop behavior:

1. Parse the grid and validate it. Grids already in an error state return
   `data: null`; already-satisfied grids return `data: undefined`
   immediately.
2. Filter the registered lemmas down to those `isApplicable(grid)` for this
   puzzle.
3. Loop: iterate the lemmas in registration order and call
   `lemma.apply(context)`. As soon as one returns `true` (it changed
   something), **restart from the first lemma** — cheap deductions are
   always re-attempted before expensive ones. The loop ends after a full
   pass with no changes.
   - In non-`completeSolve` mode, the loop stops after the first change and
     reports only the first history entry, so the UI can present one hint at
     a time without overwhelming the user.
4. Report the resulting grid (and proofs if requested).

`InsightError`s thrown by lemmas or stores are caught and reported as
`{ type: 'error' }`; anything else is rethrown (it's a bug, not a
contradiction).

### InsightContext

`insightContext.ts` is the **central mutable state** for a solve:

- `grid` — the current grid (immutable `GridData`, replaced on every change)
- `tileHistory` — a `TileChange[]` log (`oldGrid`, `newGrid`, `proof`) of
  every committed deduction; this is what becomes the emitted proofs
- `setTiles(newTiles, proof?)` — the **only** way to change the grid. It
  swaps in the new tiles, notifies every initialized store
  (`onGridUpdate()`), and appends to `tileHistory` if a proof is given
- `copy()` — deep-copies the context (including store state) so lemmas can
  do speculative/lookahead work without corrupting the real one
- Lazily-initialized, read-only accessors for the stores: `numberSymbols`,
  `areas`, `regions` — each is created on first access and kept in sync by
  `setTiles`

## Lemmas

A lemma is a single deduction technique. The contract
(`lemmas/insightLemma.ts`) is minimal:

```ts
abstract class InsightLemma {
  abstract get id(): string;
  abstract isApplicable(grid: GridData): boolean; // cheap static filter
  abstract apply(context: InsightContext): boolean; // true = made progress
  protected proof(): Proof;      // Proof.create(this.id)
  protected error(msg): InsightError; // contradiction with source = this.id
}
```

All lemmas are instantiated once and registered in `lemmas/allLemmas.ts`.
Registration order matters: it defines both the attempt order in the main
loop and the implicit preference for cheap deductions (the loop restarts
from the top after every change).

Typical lemma behavior:

- `isApplicable` should be a cheap static check (e.g. "does the grid contain
  a connect-all rule?") so non-relevant lemmas are skipped entirely.
- `apply` reads the context grid and stores, and either:
  - records **relational** deductions through stores
    (`context.regions.addConnected` / `addDisconnected`), and/or
  - **fills tiles** by calling `context.setTiles(newTiles, proof)`.
- Return `true` iff anything changed (the main loop relies on this).
- Throw `this.error(...)` when the current state is contradictory — this
  aborts the solve and marks the puzzle unsolvable.
- Use `context.copy()` for speculative reasoning, `modifyTiles()` and the
  `helper.ts` utilities for tile manipulation, and `cell()`/`area()` for
  human-readable positions in proof descriptions.

Lemmas come and go as techniques are added — **don't hard-code lists** of
them anywhere; always go through `allLemmas`.

## Stores

Stores (`stores/`, base class `InsightStore`) track **derived state** that is
expensive to recompute and useful to many lemmas. They are created lazily by
the context, refreshed on every `setTiles` (`onGridUpdate()`), deep-copyable
(`copyWithContext`), and they remember **which proofs justified which
deductions** so those proofs can be referenced later.

Key terminology (see the long comment in `regionStore.ts`):

- An **area** is a maximal group of orthogonally-connected same-color,
  non-gray tiles (`AreaStore`). Areas are cheap to compute and are rebuilt
  from scratch on every grid change.
- A **region** is a group of areas that lemmas have deduced to be connected
  (or disconnected) (`RegionStore`). Regions persist across grid updates —
  their connection/disconnection proofs survive and are re-keyed to the new
  areas after every recompute.

### AreaStore

Maps every cell to its `Area` (id, color, positions, symbols). Recomputed
per grid update.

### RegionStore

The heart of the solver. It maintains:

- a **disjoint set** (union-find, `stores/disjointSet.ts`) over area IDs,
  grouping areas into regions
- `connectionProofs` — proofs that two areas are logically connected
- `disconnectionProofs` — proofs that two regions can never connect
- `physicalDisconnections` — regions that are unreachable from each other
  through their own color given the current grid (recomputed per update)
- the `Region` objects themselves (color, positions, symbols, connected
  areas, and the accumulated proofs)

Important semantics:

- `addConnected(cellA, cellB, proof)` merges two regions (union) and throws
  an `InsightError` if they are already known to be disconnected or are
  different colors — that is how contradictions surface.
- `addDisconnected(cellA, cellB, proof)` throws if the regions are already
  connected.
- `isConnected` / `isDisconnected` answer queries **including** lemma
  deductions and attach the justifying proofs to a `Proof` you pass in —
  this is how dependent deductions inherit their evidence.
- `Region.getRegionMap()` answers for every cell whether it is in the region
  (`true`), definitely not (`false`), or possibly (`null`).
- `Region.getRegionGraph()` builds a graph (`stores/regionGraph.ts`) over
  that map for connectivity computations — e.g. shortest paths and
  articulation points (bottlenecks).

### NumberSymbolStore

Tracks the possible true values of number symbols (e.g. both `n±x`
possibilities when an off-by-X rule is present) and the proofs that
eliminated possibilities.

## Proofs and difficulty

`types/proof.ts` defines `Proof` (builder) and `ProofNode` (tree node):

```ts
interface ProofNode {
  source: string;        // lemma or store id
  description: string;   // human-readable explanation
  difficulty: number;    // technique difficulty estimate
  children: Set<ProofNode>; // sub-deductions this proof depends on
}
```

- Lemmas start a proof with `this.proof().difficulty(n).describe(text)`.
- Whenever a deduction relies on earlier deductions (e.g. a region
  connection established by another lemma), the store methods
  (`addConnected`, `isConnected`, `getRegionMap`, ...) `add()` the earlier
  proofs as children of the new proof, forming a **dependency tree**.
- `context.setTiles(newTiles, proof)` commits a deduction to
  `tileHistory`; the worker maps history entries to `proof.root` when
  `reportProof` is set.
- `Proof#toString()` renders an indented tree (also printed to the worker's
  console after each successful lemma for debugging).
- `difficulty` is a per-technique estimate assigned by each lemma; the UI
  shows it next to every proof node, giving users (and potential rating
  features) a sense of how hard the required deductions were.

## Error handling

`InsightError` (in `types/insightError.ts`) carries a `source` (the id of
the lemma or store that threw it) and signals a **logical contradiction** —
the puzzle has no valid solution. The worker catches it and reports
`{ type: 'error', message }`; `InsightSolver.solve()` then yields `null`
(unsolvable). Any non-`InsightError` exception is a programming error and is
rethrown so it surfaces loudly instead of being mistaken for an unsolvable
puzzle.

## Adding a new lemma

1. Create `lemmas/myLemma.ts` extending `InsightLemma` with a unique
   kebab-case `id`.
2. Implement `isApplicable` (cheap) and `apply` (return `true` only when the
   context actually changed).
3. Use the stores instead of re-deriving state; record relational
   deductions with proofs via `context.regions` and fill tiles via
   `context.setTiles(newTiles, proof)`.
4. Register it in `lemmas/allLemmas.ts` at the position reflecting its cost
   (cheaper techniques earlier).
5. Give every emitted proof a meaningful `difficulty` and a `describe()`d
   explanation — these are user-facing (and used for difficulty ratings).

## Debugging tips

- The worker logs each lemma attempt and the resulting proof trees to the
  worker console (`%c<lemma-id>: successful / no changes` followed by
  `history.proof.toString()`), so open DevTools' worker context (or the page
  console, which forwards it) and watch a solve.
- The easiest way to exercise the solver in the UI:
  - `src/client/components/GridInsight.tsx` (enabled by the "grid insight"
    setting) calls `solver.process(..., { completeSolve: false,
    reportProof: true })` on the current grid, renders the returned proof
    trees as a nested list, and highlights the involved cells on the grid —
    perfect for seeing exactly what a lemma deduced and why.
  - `src/client/editor/SolverSelector.tsx` (used by the puzzle checklist)
    runs full solves via `solver.solve()`.
- To test without the UI, import the package, build a grid with
  `GridData.create(...)` plus rules/symbols, and run
  `solver.process(grid, { completeSolve: true, reportProof: true })` — but
  note `process` needs a Worker; in Node you may need to stub or polyfill
  it, or drive the worker file directly.

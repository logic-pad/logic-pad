# Logic Pad — Agent Guide

Logic Pad is a production puzzle creation and sharing website for grid-based
puzzles (in the style of Islands of Insight).

## Project overview

- **Frontend** (`src/client`): React 19 + Vite SPA, TanStack Router/Query,
  jotai (+ jotai-scope), Tailwind CSS v4 + DaisyUI v5, Monaco editor.
- **Puzzle logic** (`packages/logic-core`): the `@logic-pad/core` library —
  grid data model, rules, symbols, serializers, validators, and multiple
  solvers.
- **Backend**: a separate project (`logic-pad-api`). In dev, Vite proxies
  `/api/*` to `http://localhost:3000`.

## Documentation

Detailed guides live in `docs/`:

- [`docs/ui.md`](docs/ui.md) — frontend structure, design language
  (generic vs puzzle-specific UI), key concepts (screens, scopes,
  instruction parts, modes), commands, and a visual debugging workflow with
  headless Chrome screenshots.
- [`docs/insight-solver.md`](docs/insight-solver.md) — architecture of the
  Insight Solver (`packages/logic-core/src/data/solver/insight/`): the
  worker protocol, solve loop, lemmas, stores, and proof system.
- [`docs/agents/insight-solver-dev.md`](docs/agents/insight-solver-dev.md) —
  hands-on workflow for developing Insight Solver lemmas: scratch-script
  reproduction, store introspection, the dual-mode verification rule,
  codebase invariants that are easy to violate, proof/difficulty conventions,
  and a regression corpus of puzzle links.

## Quick start

```bash
bun install
bun run dev          # Vite dev server on :5173 (proxies /api to :3000)
```

Before considering a change done, run:

```bash
bun run lint
bunx --bun tsc --noEmit
```

Do **not** run `bun build` inside `packages/logic-core`: the build (in
particular the `typegen` step) takes a very long time, so always skip it.
Lint and `tsc --noEmit` are sufficient verification for agent changes.

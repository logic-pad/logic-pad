/**
 * Evaluates the insight solver against the dev puzzles.
 *
 * Puzzles are solved in ascending difficulty order. For each puzzle, the
 * solver's output is compared against the solution embedded in the puzzle
 * link. As soon as a puzzle fails (incorrect solution, contradiction, or no
 * further insight before completion), its link is printed and the script
 * terminates with a non-zero exit code.
 *
 * Usage: bun run insight-eval
 */
import GridData from '../src/data/grid.js';
import { Color } from '../src/data/primitives.js';
import { Puzzle } from '../src/data/puzzle.js';
import { Serializer } from '../src/data/serializer/allSerializers.js';
import { Compressor } from '../src/data/serializer/compressor/allCompressors.js';
import InsightSolver from '../src/data/solver/insight/insightSolver.js';

/**
 * An insight solver that uses a console-silenced worker so the evaluation
 * output stays clean. All solving behavior is identical to InsightSolver.
 */
class QuietInsightSolver extends InsightSolver {
  protected override createWorker(): Worker {
    return new Worker(new URL('./insightWorkerQuiet.js', import.meta.url), {
      type: 'module',
    });
  }
}

interface PuzzleEntry {
  pid: number;
  difficulty: number;
  puzzleLink: string;
}

const puzzlesPath = `${import.meta.dir}/../../../references/dev_puzzles.json`;

async function parseLink(link: string): Promise<Puzzle> {
  const data = new URL(link).searchParams.get('d');
  if (data === null) throw new Error('Missing data parameter');
  return Serializer.parsePuzzle(await Compressor.decompress(data));
}

function toLocalLink(link: string): string {
  const url = new URL(link);
  return `http://localhost:5173${url.pathname}${url.search}`;
}

/**
 * Find a tile that is filled in `grid` but contradicts `solution`.
 */
function findContradiction(
  grid: GridData,
  solution: GridData
): { x: number; y: number } | undefined {
  return grid.forEach((tile, x, y) => {
    if (!tile.exists || tile.color === Color.Gray) return undefined;
    const solutionTile = solution.getTile(x, y);
    if (!solutionTile.exists || solutionTile.color !== tile.color)
      return { x, y };
    return undefined;
  });
}

let entries = (await Bun.file(puzzlesPath).json()) as PuzzleEntry[];
entries = entries
  .filter(x => x.difficulty > 0)
  .sort((a, b) => a.difficulty - b.difficulty || a.pid - b.pid);

const solver = new QuietInsightSolver();

console.log(
  `Evaluating ${entries.length} puzzles in ascending difficulty order...`
);

for (const [index, entry] of entries.entries()) {
  const status = `[${index + 1}/${entries.length}] pid ${entry.pid} (difficulty ${entry.difficulty}) ... `;
  process.stdout.write(status);

  let puzzle: Puzzle;
  try {
    puzzle = await parseLink(entry.puzzleLink);
  } catch (error) {
    console.log(`FAILED: cannot parse puzzle link (${String(error)})`);
    console.log(toLocalLink(entry.puzzleLink));
    process.exit(1);
  }
  if (!puzzle.solution) {
    console.log('skipped (no solution embedded in link)');
    continue;
  }

  const result = await solver.process(puzzle.grid.resetTiles(), {
    completeSolve: true,
    reportProof: false,
  });

  let failure: string | null = null;
  if (result instanceof Error) {
    failure = `solver reported a contradiction: ${result.message}`;
  } else if (result.grid === null) {
    failure = 'solver rejected the grid (invalid initial state)';
  } else if (result.grid === undefined) {
    failure = 'solver found no further insight before completing the solution';
  } else if (result.grid.colorEquals(puzzle.solution)) {
    failure = null;
  } else {
    const contradiction = findContradiction(result.grid, puzzle.solution);
    failure = contradiction
      ? `solver output an incorrect solution (tile at (${contradiction.x}, ${contradiction.y}) contradicts the solution)`
      : 'solver found no further insight before completing the solution';
  }

  if (failure !== null) {
    console.log(`FAILED: ${failure}`);
    console.log();

    // rerun solve to display logs
    const loggingSolver = new InsightSolver();
    await loggingSolver.process(puzzle.grid.resetTiles(), {
      completeSolve: true,
      reportProof: true,
    });
    console.log();

    console.log(toLocalLink(entry.puzzleLink));
    process.exit(1);
  }

  console.log('OK');
}

console.log('All puzzles solved correctly.');

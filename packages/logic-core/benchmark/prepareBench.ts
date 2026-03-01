import { parseArgs } from 'util';
import { allSolvers } from '../src/data/solver/allSolvers.js';
import {
  BenchmarkEntry,
  parseLink,
  PuzzleEntry,
  shuffleArray,
} from './helper.js';
import PQueue from 'p-queue';

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    name: {
      type: 'string',
      short: 'n',
    },
    file: {
      type: 'string',
      short: 'f',
    },
    maxTime: {
      type: 'string',
      default: '10',
      short: 't',
    },
    maxCount: {
      type: 'string',
      default: '200',
      short: 'c',
    },
    concurrency: {
      type: 'string',
      default: '4',
      short: 'd',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  strict: true,
  allowPositionals: true,
});

positionals.splice(0, 2); // Remove "bun" and script name

if (values.help || positionals.length !== 1 || !values.file) {
  console.log(`
Usage: bun bench:prepare <solver> [options]

Options:
  -f, --file <string>         Path to the puzzle data file (required)

  -n, --name <string>         Name of the generated benchmark files (default: solver name)
  -t, --maxTime <number>      Maximum seconds allowed for each solve (default: 10)
  -c, --maxCount <number>     Maximum number of puzzles included (default: 100)
  -d, --concurrency <number>  Number of solves to run concurrently (default: 4)
  -h, --help                  Show this help message

Solver:
  Name of the solver to benchmark. Available solvers are:
${[...allSolvers.keys()].map(s => `    - ${s}`).join('\n')}
`);
  process.exit(0);
}

const maxTime = parseFloat(values.maxTime) * 1000;
const maxCount = parseInt(values.maxCount);
const solverName = positionals[0];
const outputName = values.name ?? solverName;
const allPuzzlesPath = `benchmark/data/${values.file}`;

const solver = allSolvers.get(solverName);
if (!solver) {
  console.error(`Error: Solver "${solverName}" not found.`);
  process.exit(1);
}

const allPuzzles = (await Bun.file(allPuzzlesPath).json()) as PuzzleEntry[];
shuffleArray(allPuzzles);

const results: { puzzle: PuzzleEntry; result: BenchmarkEntry }[] = [];
const pqueue = new PQueue({ concurrency: 4 });
pqueue.on('completed', () => {
  if (
    results.filter(r => r.result.solveCorrect && r.result.supported).length >=
    maxCount
  ) {
    pqueue.clear();
  }
});

function printEntry(
  benchmarkEntry: BenchmarkEntry,
  entryId: number,
  pid: number
) {
  const selectedPuzzles = results.filter(
    r => r.result.solveCorrect && r.result.supported
  );
  if (benchmarkEntry.supported) {
    console.log(
      `${entryId} / ${allPuzzles.length}    \t| ${selectedPuzzles.length} / ${maxCount}    \t| ${pid}\t| ${
        Number.isNaN(benchmarkEntry.solveTime)
          ? 'timeout'
          : `${benchmarkEntry.solveTime.toFixed(0)}ms`
      } ${benchmarkEntry.solveCorrect ? '✓' : '✗'}`
    );
  } else {
    console.log(
      `${entryId} / ${allPuzzles.length}    \t| ${selectedPuzzles.length} / ${maxCount}    \t| ${pid}\t| unsupported`
    );
  }
}

console.log('Available\t| Selected\t| PID\t| Result');

for (const entry of allPuzzles) {
  const puzzle = await parseLink(entry.puzzleLink);
  void pqueue.add(async () => {
    if (!solver.isGridSupported(puzzle.grid)) {
      results.push({
        puzzle: entry,
        result: {
          pid: entry.pid,
          supported: false,
          solveTime: Number.NaN,
          solveCorrect: false,
        },
      });
      printEntry(results[results.length - 1].result, results.length, entry.pid);
      return;
    }
    const startTime = performance.now();
    const abortController = new AbortController();
    const benchmarkEntry: BenchmarkEntry = {
      pid: entry.pid,
      supported: true,
      solveTime: Number.NaN,
      solveCorrect: false,
    };
    let step = 0;
    const handle = setTimeout(() => {
      abortController.abort();
    }, maxTime);
    try {
      for await (const solution of solver.solve(
        puzzle.grid,
        abortController.signal
      )) {
        if (step === 0) {
          const solveCorrect = solution?.colorEquals(puzzle.solution!) ?? false;
          if (!solveCorrect) break;
        } else {
          benchmarkEntry.solveCorrect = solution === null;
          if (benchmarkEntry.solveCorrect)
            benchmarkEntry.solveTime = performance.now() - startTime;
          break;
        }
        step++;
      }
    } catch {
      benchmarkEntry.solveCorrect = false;
    }
    clearTimeout(handle);
    results.push({ puzzle: entry, result: benchmarkEntry });
    printEntry(results[results.length - 1].result, results.length, entry.pid);
  });
}

await pqueue.onIdle();

const selectedPuzzles = results.filter(
  r => r.result.solveCorrect && r.result.supported
);
const benchmarkEntries = selectedPuzzles.map(r => r.result);

await Bun.write(
  `benchmark/data/${outputName}_bench_puzzles.json`,
  JSON.stringify(
    selectedPuzzles.map(r => r.puzzle),
    null,
    2
  )
);
await Bun.write(
  `benchmark/data/${outputName}_bench_results.json`,
  JSON.stringify(benchmarkEntries, null, 2)
);

console.log(`
Benchmark preparation completed. Selected ${selectedPuzzles.length} puzzles.

- Solver: ${solverName}   Max Time: ${maxTime}ms   Max Count: ${maxCount}
- Average time: ${selectedPuzzles.reduce((a, b) => a + b.result.solveTime, 0) / selectedPuzzles.length}ms
- Solve correctness: ${benchmarkEntries.filter(e => e.solveCorrect).length} / ${benchmarkEntries.length}
`);

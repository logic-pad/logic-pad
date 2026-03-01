import { parseArgs } from 'util';
import { allSolvers } from '../src/data/solver/allSolvers.js';
import { BenchmarkEntry, parseLink, PuzzleEntry } from './helper.js';
import PQueue from 'p-queue';

const allPuzzlesPath = 'benchmark/data/all_puzzles_logic_pad.json';

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    maxTime: {
      type: 'string',
      default: '10',
      short: 't',
    },
    maxCount: {
      type: 'string',
      default: '99999',
      short: 'c',
    },
    concurrency: {
      type: 'string',
      default: '4',
      short: 'n',
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

if (values.help || positionals.length !== 1) {
  console.log(`
Usage: bun bench:prepare <solver> [options]

Options:
  -t, --maxTime <number>      Maximum seconds allowed for each solve (default: 10)
  -c, --maxCount <number>     Maximum number of puzzles included (default: 100)
  -n, --concurrency <number>  Number of solves to run concurrently (default: 4)
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

const solver = allSolvers.get(solverName);
if (!solver) {
  console.error(`Error: Solver "${solverName}" not found.`);
  process.exit(1);
}

const allPuzzles = (await Bun.file(allPuzzlesPath).json()) as PuzzleEntry[];
allPuzzles.sort(() => Math.random() - 0.5);

const results: { puzzle: PuzzleEntry; result: BenchmarkEntry }[] = [];
const pqueue = new PQueue({ concurrency: 4 });

function printEntry(
  benchmarkEntry: BenchmarkEntry,
  entryId: number,
  solverId: string,
  pid: number
) {
  if (benchmarkEntry.supported) {
    console.log(
      `${solverId}\t| ${entryId} / ${allPuzzles.length}\t| ${pid}\t| ${
        Number.isNaN(benchmarkEntry.solveTime)
          ? 'timeout'
          : `${benchmarkEntry.solveTime.toFixed(0)}ms`
      } ${benchmarkEntry.solveCorrect ? '✓' : '✗'}`
    );
  } else {
    console.log(
      `${solverId}\t| ${entryId} / ${allPuzzles.length}\t| ${pid}\t| unsupported`
    );
  }
}

console.log('Available\t| Selected\t| PID\t| Result');

for (const entry of allPuzzles) {
  if (
    results.filter(r => r.result.solveCorrect && r.result.supported).length >=
    maxCount
  ) {
    break;
  }

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
      printEntry(
        results[results.length - 1].result,
        results.length,
        solverName,
        entry.pid
      );
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
    printEntry(
      results[results.length - 1].result,
      results.length,
      solverName,
      entry.pid
    );
  });
}

await pqueue.onIdle();

const selectedPuzzles = results.filter(
  r => r.result.solveCorrect && r.result.supported
);
const benchmarkEntries = selectedPuzzles.map(r => r.result);

await Bun.write(
  `benchmark/data/bench_${solverName}_puzzles.json`,
  JSON.stringify(
    selectedPuzzles.map(r => r.puzzle),
    null,
    2
  )
);
await Bun.write(
  `benchmark/data/bench_${solverName}_results.json`,
  JSON.stringify(benchmarkEntries, null, 2)
);

console.log(`
Benchmark preparation completed. Selected ${selectedPuzzles.length} puzzles.

- Solver: ${solverName}   Max Time: ${maxTime}ms   Max Count: ${maxCount}
- Average time: ${benchmarkEntries.filter(e => !Number.isNaN(e.solveTime)).reduce((a, b) => a + b.solveTime, 0) / benchmarkEntries.filter(e => !Number.isNaN(e.solveTime)).length}ms
- Number of timeouts: ${benchmarkEntries.filter(e => Number.isNaN(e.solveTime)).length}
- Solve correctness: ${benchmarkEntries.filter(e => e.solveCorrect).length} / ${benchmarkEntries.length}
`);

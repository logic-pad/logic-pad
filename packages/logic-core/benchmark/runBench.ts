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

if (values.help || positionals.length === 0) {
  console.log(`
Usage: bun bench:run <solver> [options]

Options:
  -n, --name <string>         Name of the generated benchmark files (default: first solver name)
  -t, --maxTime <number>      Maximum seconds allowed for each solve (default: 10)
  -c, --maxCount <number>     Maximum number of puzzles included (default: 100)
  -n, --concurrency <number>  Number of solves to run concurrently (default: 4)
  -h, --help                  Show this help message

Solvers available for benchmarking:
${[...allSolvers.keys()].map(s => `    - ${s}`).join('\n')}
`);
  process.exit(0);
}

const maxTime = parseFloat(values.maxTime) * 1000;
const maxCount = parseInt(values.maxCount);
const concurrency = parseInt(values.concurrency);

for (const name of positionals) {
  if (!allSolvers.has(name)) {
    console.error(`Error: Solver "${name}" not found.`);
    process.exit(1);
  }
}

const outputName = values.name ?? positionals[0];

const allPuzzles = (await Bun.file(
  `benchmark/data/${outputName}_bench_puzzles.json`
).json()) as PuzzleEntry[];
shuffleArray(allPuzzles);
allPuzzles.splice(maxCount);

const benchmarkEntries: { [key: string]: BenchmarkEntry[] } =
  Object.fromEntries(
    positionals.map(name => [
      name,
      allPuzzles.map(p => ({
        pid: p.pid,
        supported: false,
        solveTime: Number.NaN,
        solveCorrect: false,
      })),
    ])
  );

const pqueue = new PQueue({ concurrency });

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

console.log('Solver     \t| Trial     \t| PID\t| Result');
console.log();

for (let i = 0; i < allPuzzles.length; i++) {
  const entry = allPuzzles[i];

  const solvers = positionals.slice().sort(() => Math.random() - 0.5);

  const puzzle = await parseLink(entry.puzzleLink);
  for (const solverId of solvers) {
    const solver = allSolvers.get(solverId)!;
    void pqueue.add(async () => {
      if (!solver.isGridSupported(puzzle.grid)) {
        benchmarkEntries[solverId][i] = {
          pid: entry.pid,
          supported: false,
          solveTime: Number.NaN,
          solveCorrect: false,
        };
        printEntry(benchmarkEntries[solverId][i], i + 1, solverId, entry.pid);
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
            const solveCorrect =
              solution?.colorEquals(puzzle.solution!) ?? false;
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
      benchmarkEntries[solverId][i] = benchmarkEntry;
      printEntry(benchmarkEntry, i + 1, solverId, entry.pid);
    });
  }
}

await pqueue.onIdle();

const results = positionals.map(name => ({
  solver: name,
  fastestCount: 0,
  solve25: 0,
  solve50: 0,
  solve75: 0,
  solve90: 0,
  solveSD: 0,
  unsupportedCount: 0,
  incorrectCount: 0,
  timeoutCount: 0,
}));

for (let i = 0; i < benchmarkEntries[positionals[0]].length; i++) {
  let fastestSolveTime = Number.POSITIVE_INFINITY;
  let fastestSolverIndex: number | null = null;

  for (let j = 0; j < positionals.length; j++) {
    const entry = benchmarkEntries[positionals[j]][i];
    if (!entry.supported) {
      results[j].unsupportedCount++;
      continue;
    }
    if (entry.solveCorrect && !Number.isNaN(entry.solveTime)) {
      if (entry.solveTime < fastestSolveTime) {
        fastestSolveTime = entry.solveTime;
        fastestSolverIndex = j;
      }
    } else if (!Number.isNaN(entry.solveTime)) {
      results[j].incorrectCount++;
    } else {
      results[j].timeoutCount++;
    }
  }

  if (fastestSolverIndex !== null) {
    results[fastestSolverIndex].fastestCount++;
  }
}

for (let j = 0; j < positionals.length; j++) {
  const entries = benchmarkEntries[positionals[j]].filter(
    e => e.supported && e.solveCorrect && !Number.isNaN(e.solveTime)
  );
  // 25th percentile
  const times = entries.map(e => e.solveTime).sort((a, b) => a - b);
  results[j].solve25 =
    times.length === 0
      ? Number.NaN
      : times[Math.floor((times.length - 1) * 0.25)];
  // 50th percentile (median)
  results[j].solve50 =
    times.length === 0
      ? Number.NaN
      : times[Math.floor((times.length - 1) * 0.5)];
  // 75th percentile
  results[j].solve75 =
    times.length === 0
      ? Number.NaN
      : times[Math.floor((times.length - 1) * 0.75)];
  // 90th percentile
  results[j].solve90 =
    times.length === 0
      ? Number.NaN
      : times[Math.floor((times.length - 1) * 0.9)];
  // Standard deviation
  const mean = times.reduce((sum, time) => sum + time, 0) / (times.length || 1);
  const variance =
    times.reduce((sum, time) => sum + (time - mean) ** 2, 0) /
    (times.length || 1);
  results[j].solveSD = Math.sqrt(variance);
}

console.log('\nBenchmark Results:');
for (const result of results) {
  console.log(`
${result.solver}:
  Fastest Solves: ${result.fastestCount}
  Solve time:
    P25: ${
      Number.isNaN(result.solve25) ? 'N/A' : `${result.solve25.toFixed(2)}ms`
    }
    P50: ${
      Number.isNaN(result.solve50) ? 'N/A' : `${result.solve50.toFixed(2)}ms`
    }
    P75: ${
      Number.isNaN(result.solve75) ? 'N/A' : `${result.solve75.toFixed(2)}ms`
    }
    P90: ${
      Number.isNaN(result.solve90) ? 'N/A' : `${result.solve90.toFixed(2)}ms`
    }
    SD:  ${
      Number.isNaN(result.solveSD) ? 'N/A' : `${result.solveSD.toFixed(2)}ms`
    }
  Unsupported Puzzles: ${result.unsupportedCount}
  Incorrect Solutions: ${result.incorrectCount}
  Timeouts:            ${result.timeoutCount}
`);
}

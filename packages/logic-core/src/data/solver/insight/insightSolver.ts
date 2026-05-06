import GridData from '../../grid.js';
import Solver from '../solver.js';
import { Serializer } from '../../serializer/allSerializers.js';
import type { Response, SolveRequest } from './insightWorker.js';
import type { ProofNode } from './types/proof.js';

export default class InsightSolver extends Solver {
  public readonly id = 'insight';

  public readonly author = 'romain22222, Lysine';

  public readonly supportsCancellation = true;

  public readonly description =
    'An insight-driven solver that outputs logical deductions and difficulty rating as it solves the puzzle.';

  protected createWorker(): Worker {
    return new Worker(new URL('./insightWorker.js', import.meta.url), {
      type: 'module',
    });
  }

  protected isEnvironmentSupported(): Promise<boolean> {
    try {
      const worker = this.createWorker();
      worker.terminate();
      return Promise.resolve(true);
    } catch (_ex) {
      return Promise.resolve(false);
    }
  }

  public async *solve(
    grid: GridData,
    abortSignal?: AbortSignal
  ): AsyncGenerator<GridData | null> {
    const result = await this.process(grid.resetTiles(), {
      completeSolve: true,
      reportProof: false,
      abortSignal,
    });
    if (result instanceof Error) {
      yield null;
    } else if (result.grid === undefined) {
      return;
    } else {
      yield result.grid;
    }
  }

  public process(
    grid: GridData,
    options: {
      completeSolve: boolean;
      reportProof: boolean;
      onProgress?: (progress: number, total: number) => void;
      abortSignal?: AbortSignal;
    }
  ): Promise<
    { grid: GridData | null | undefined; proofs?: ProofNode[] } | Error
  > {
    return new Promise((resolve, reject) => {
      const worker = this.createWorker();
      const terminateHandler = () => {
        worker.terminate();
        if (terminateHandler)
          options.abortSignal?.removeEventListener('abort', terminateHandler);
      };
      options.abortSignal?.addEventListener('abort', terminateHandler);

      worker.postMessage({
        data: Serializer.stringifyGrid(grid),
        completeSolve: options.completeSolve,
        reportProof: options.reportProof,
        reportProgress: !!options.onProgress,
      } satisfies SolveRequest);

      worker.addEventListener('message', (e: MessageEvent<Response>) => {
        const data = e.data;
        if (data.type === 'progress') {
          options.onProgress?.(data.progress, data.total);
          return;
        } else if (data.type === 'solve') {
          if (data.data) {
            resolve({
              grid: Serializer.parseGrid(data.data),
              proofs: data.proofs,
            });
          } else if (data.data === null) {
            resolve({
              grid: null,
              proofs: data.proofs,
            });
          } else {
            resolve({
              grid: undefined,
              proofs: data.proofs,
            });
          }
        } else if (data.type === 'error') {
          resolve(new Error(data.message));
        }
        terminateHandler?.();
      });

      worker.addEventListener('error', (e: ErrorEvent) => {
        console.log(e);
        reject(new Error(e.message));
        terminateHandler?.();
      });
    });
  }
}

import GridData from '../grid.js';
import { Serializer } from '../serializer/allSerializers.js';
import Solver from './solver.js';
import { EventIterator } from 'event-iterator';

export default abstract class EventIteratingSolver extends Solver {
  public readonly supportsCancellation = true;

  protected abstract createWorker(): Worker;

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
    const worker = this.createWorker();

    let terminateHandler: (() => void) | undefined;

    try {
      const iterator = new EventIterator<GridData | null>(
        ({ push, stop, fail }) => {
          terminateHandler = () => {
            worker.terminate();
            stop();
          };
          abortSignal?.addEventListener('abort', terminateHandler);

          worker.postMessage(Serializer.stringifyGrid(grid.resetTiles()));

          worker.addEventListener(
            'message',
            (e: MessageEvent<string | null>) => {
              if (e.data) {
                push(Serializer.parseGrid(e.data));
              } else if (e.data === null) {
                push(null);
                stop(); // Stop after the first signal for out of solutions
              } else {
                stop();
              }
            }
          );

          worker.addEventListener('error', (e: ErrorEvent) => {
            alert(`Error while solving!\n${e.message}`);
            fail(e as unknown as Error);
          });
        }
      );

      for await (const solution of iterator) {
        yield solution;
      }
    } finally {
      worker.terminate();
      if (terminateHandler)
        abortSignal?.removeEventListener('abort', terminateHandler);
    }
  }
}

import debounce from 'lodash/debounce.js';
import GridData from './grid.js';
import { Serializer } from './serializer/allSerializers.js';
import { GridState } from './primitives.js';
import validateGrid from './validate.js';

const SYNC_VALIDATION_THRESHOLD = 10000;

export class GridValidator {
  private worker: Worker | null = null;
  private stateListeners = new Set<(state: GridState) => void>();
  private loadListeners = new Set<() => void>();

  private readonly validateGridDebounced = debounce(
    (grid: GridData, solution: GridData | null) => {
      this.worker?.terminate();
      this.worker = new Worker(
        new URL('./validateAsyncWorker.js', import.meta.url),
        { type: 'module' }
      );
      this.worker.onmessage = (event: MessageEvent) => {
        if (event.data) {
          this.notifyState(event.data as GridState);
        }
        this.worker?.terminate();
        this.worker = null;
        this.notifyLoad();
      };
      this.worker.onmessageerror = (error: MessageEvent) => {
        console.error('Validation worker error:', error);
        this.worker?.terminate();
        this.worker = null;
        this.notifyLoad();
      };
      this.worker.postMessage({
        grid: Serializer.stringifyGrid(grid),
        solution: solution ? Serializer.stringifyGrid(solution) : null,
      });
      this.notifyLoad();
    },
    300,
    { leading: true, trailing: true }
  );

  public readonly validateGrid = (
    grid: GridData,
    solution: GridData | null
  ) => {
    if (grid.width * grid.height <= SYNC_VALIDATION_THRESHOLD) {
      // Synchronous validation for small grids
      // to avoid the overhead of worker communication.
      const state = validateGrid(grid, solution);
      this.notifyState(state);
    } else {
      this.validateGridDebounced(grid, solution);
    }
  };

  private readonly notifyState = (state: GridState) => {
    this.stateListeners.forEach(listener => listener(state));
  };

  public readonly subscribeToState = (listener: (state: GridState) => void) => {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  };

  private readonly notifyLoad = () => {
    this.loadListeners.forEach(listener => listener());
  };

  public readonly subscribeToLoad = (listener: () => void) => {
    this.loadListeners.add(listener);
    return () => {
      this.loadListeners.delete(listener);
    };
  };

  public readonly isLoading = () => {
    return this.worker !== null;
  };

  public readonly delete = () => {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.stateListeners.clear();
  };
}

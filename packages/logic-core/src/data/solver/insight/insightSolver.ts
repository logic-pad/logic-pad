import GridData from '../../grid.js';
import EventIteratingSolver from '../eventIteratingSolver.js';

export default class InsightSolver extends EventIteratingSolver {
  public readonly id = 'insight';

  public readonly author = 'romain22222, Lysine';

  public readonly description =
    'An insight-driven solver that outputs logical deductions and difficulty rating as it solves the puzzle.';

  public isInstructionSupported(): boolean {
    // TODO -> for the moment, there is so few lemmas that it's meaningless to check if a specific instruction is supported
    return true;
  }

  protected preprocessGrid(grid: GridData): GridData {
    // Keep the grid as is without resetting the tiles for debug
    return grid;
  }

  protected createWorker(): Worker {
    return new Worker(new URL('./insightWorker.js', import.meta.url), {
      type: 'module',
    });
  }
}

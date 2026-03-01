import GridData from '../grid.js';
import { State } from '../primitives.js';
import Symbol from './symbol.js';

/**
 * All symbols which contain a number should extend this class to be compatible with off by X rules.
 */
export default abstract class NumberSymbol extends Symbol {
  public constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly number: number
  ) {
    super(x, y);
    this.number = number;
  }

  public abstract countTiles(grid: GridData): {
    completed: number;
    possible: number;
  } | null;

  public validateSymbol(grid: GridData): State {
    const countResult = this.countTiles(grid);
    if (countResult === null) return State.Error;
    const { completed, possible } = countResult;
    if (completed > this.number || possible < this.number) return State.Error;
    if (completed === this.number && possible === this.number)
      return State.Satisfied;
    return State.Incomplete;
  }

  public withNumber(number: number): this {
    return this.copyWith({ number });
  }
}

export const instance = undefined;

import Symbol from './symbol.js';
import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { State } from '../primitives.js';

/**
 * A marker for symbols not supported by the current solver.
 * Solvers should count these symbols in the symbols per region rule but otherwise ignore them.
 */
export default class UnsupportedSymbol extends Symbol {
  public readonly title = 'Unsupported Symbol';

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Number,
      default: 0,
      field: 'x',
      description: 'X',
      configurable: false,
    },
    {
      type: ConfigType.Number,
      default: 0,
      field: 'y',
      description: 'Y',
      configurable: false,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(GridData.create(['.']));

  public get id(): string {
    return `unsupported`;
  }

  public get explanation(): string {
    return 'Unsupported symbol';
  }

  public get configs(): readonly AnyConfig[] | null {
    return UnsupportedSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return UnsupportedSymbol.EXAMPLE_GRID;
  }

  public validateSymbol(_grid: GridData, _solution: GridData | null): State {
    return State.Satisfied;
  }

  public copyWith({ x, y }: { x?: number; y?: number }): this {
    return new UnsupportedSymbol(x ?? this.x, y ?? this.y) as this;
  }
}

export const instance = new UnsupportedSymbol(0, 0);

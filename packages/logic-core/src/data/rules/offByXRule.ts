import { AnyConfig, ConfigType } from '../config.js';
import { SymbolValidationHandler } from '../events/onSymbolValidation.js';
import GridData from '../grid.js';
import { Color, RuleState, State } from '../primitives.js';
import AreaNumberSymbol from '../symbols/areaNumberSymbol.js';
import NumberSymbol from '../symbols/numberSymbol.js';
import Symbol from '../symbols/symbol.js';
import Rule, { SearchVariant } from './rule.js';

export default class OffByXRule
  extends Rule
  implements SymbolValidationHandler
{
  public readonly title = 'Off By X';

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Number,
      default: 1,
      min: 1,
      field: 'number',
      description: 'Number',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze([
    GridData.create(['bbbbb', 'bwbwb', 'bbwwb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 1, 2),
      new AreaNumberSymbol(3, 2, 2),
    ]),
    GridData.create(['bbbbb', 'bwbwb', 'bbbwb', 'bwwwb']).withSymbols([
      new AreaNumberSymbol(1, 1, 3),
      new AreaNumberSymbol(3, 3, 3),
    ]),
    GridData.create(['bbbbw', 'bwbbw', 'bbbbw', 'bwwww']).withSymbols([
      new AreaNumberSymbol(1, 1, 4),
      new AreaNumberSymbol(4, 3, 4),
    ]),
    GridData.create(['bbbbw', 'bwbbw', 'bbbww', 'wwwww']).withSymbols([
      new AreaNumberSymbol(1, 1, 5),
      new AreaNumberSymbol(4, 3, 5),
    ]),
    GridData.create(['bbbww', 'bwbww', 'bbbww', 'wwwww']).withSymbols([
      new AreaNumberSymbol(1, 1, 6),
      new AreaNumberSymbol(4, 3, 6),
    ]),
    GridData.create(['wbbww', 'bbwww', 'bbwww', 'wwwww']).withSymbols([
      new AreaNumberSymbol(0, 0, 7),
      new AreaNumberSymbol(4, 3, 7),
    ]),
    GridData.create(['wbbww', 'bwwww', 'bwwww', 'wwwww']).withSymbols([
      new AreaNumberSymbol(0, 0, 8),
      new AreaNumberSymbol(4, 3, 8),
    ]),
    GridData.create(['wbwww', 'bwwww', 'wwwww', 'wwwww']).withSymbols([
      new AreaNumberSymbol(0, 0, 9),
      new AreaNumberSymbol(4, 3, 9),
    ]),
  ]);

  private static readonly SEARCH_VARIANTS = [new OffByXRule(1).searchVariant()];

  /**
   * **All numbers are off by &lt;number&gt;**
   *
   * @param number - The number that all cells are off by.
   */
  public constructor(public readonly number: number) {
    super();
    this.number = number;
  }

  public get id(): string {
    return `off_by_x`;
  }

  public get explanation(): string {
    return `All numbers are off by ${this.number}`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return OffByXRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    if (this.number < 1 || this.number >= OffByXRule.EXAMPLE_GRID.length) {
      return GridData.create(['bbbbb', 'bbwbb', 'bbbbb', 'bbbbb']).addSymbol(
        new AreaNumberSymbol(2, 1, this.number + 1)
      );
    }
    return OffByXRule.EXAMPLE_GRID[this.number - 1];
  }

  public get searchVariants(): SearchVariant[] {
    return OffByXRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    return {
      state:
        grid.getTileCount(true, false, Color.Gray) === 0
          ? State.Satisfied
          : State.Incomplete,
    };
  }

  public onSymbolValidation(
    grid: GridData,
    symbol: Symbol,
    _validator: (grid: GridData) => State
  ): State | undefined {
    if (symbol instanceof NumberSymbol) {
      const counts = symbol.countTiles(grid);
      if (counts === null) return State.Error;
      if (
        counts.completed > symbol.number + this.number ||
        counts.possible < symbol.number - this.number ||
        (counts.completed > symbol.number - this.number &&
          counts.possible < symbol.number + this.number)
      ) {
        return State.Error;
      } else if (
        (counts.completed === symbol.number + this.number ||
          counts.completed === symbol.number - this.number) &&
        counts.completed === counts.possible
      ) {
        return State.Satisfied;
      } else {
        return State.Incomplete;
      }
    } else {
      return undefined;
    }
  }

  public get isSingleton(): boolean {
    return true;
  }

  public copyWith({ number }: { number?: number }): this {
    return new OffByXRule(number ?? this.number) as this;
  }

  public withNumber(number: number): this {
    return this.copyWith({ number });
  }
}

export const instance = new OffByXRule(1);

import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { Color } from '../primitives.js';
import NumberSymbol from './numberSymbol.js';

export default class AreaNumberSymbol extends NumberSymbol {
  public readonly title = 'Area Number';

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
    {
      type: ConfigType.Number,
      default: 1,
      field: 'number',
      description: 'Number',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['wbbbb', 'wbbwb', 'bbwwb', 'bbbbb'])
      .addSymbol(new AreaNumberSymbol(2, 2, 3))
      .addSymbol(new AreaNumberSymbol(0, 1, 2))
  );

  /**
   * **Area Numbers must equal region sizes**
   *
   * @param x - The x-coordinate of the symbol.
   * @param y - The y-coordinate of the symbol.
   * @param number - The area number.
   */
  public constructor(x: number, y: number, number: number) {
    super(x, y, number);
  }

  public get id(): string {
    return `number`;
  }

  public get explanation(): string {
    return `*Area Numbers* must equal region sizes`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return AreaNumberSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return AreaNumberSymbol.EXAMPLE_GRID;
  }

  public countTiles(
    grid: GridData
  ): { completed: number; possible: number } | null {
    if (!this.validateSubtilePlacement(grid)) return null;

    const thisX = Math.floor(this.x);
    const thisY = Math.floor(this.y);
    const color = grid.getTile(thisX, thisY).color;
    if (color === Color.Gray)
      return { completed: 0, possible: Number.MAX_SAFE_INTEGER };
    let completeCount = 0;
    let grayCount = 0;
    grid.iterateArea(
      { x: thisX, y: thisY },
      tile => tile.color === Color.Gray || tile.color === color,
      () => {
        grayCount++;
      }
    );
    grid.iterateArea(
      { x: thisX, y: thisY },
      tile => tile.color === color,
      () => {
        completeCount++;
      }
    );
    return { completed: completeCount, possible: grayCount };
  }

  public copyWith({
    x,
    y,
    number,
  }: {
    x?: number;
    y?: number;
    number?: number;
  }): this {
    return new AreaNumberSymbol(
      x ?? this.x,
      y ?? this.y,
      number ?? this.number
    ) as this;
  }

  public withNumber(number: number): this {
    return this.copyWith({ number });
  }
}

export const instance = new AreaNumberSymbol(0, 0, 1);

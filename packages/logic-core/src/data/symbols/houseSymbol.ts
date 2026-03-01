import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { array } from '../dataHelper.js';
import { Color } from '../primitives.js';
import NumberSymbol from './numberSymbol.js';

export default class HouseSymbol extends NumberSymbol {
  public readonly title = 'House';

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
      default: 2,
      field: 'number',
      description: 'Number',
      explanation: 'Number of houses in this region',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['bbbww', 'wwwbw', 'wbbbw', 'wwwww'])
      .addSymbol(new HouseSymbol(0, 0, 2))
      .addSymbol(new HouseSymbol(2, 0, 2))
      .addSymbol(new HouseSymbol(3, 0, 2))
      .addSymbol(new HouseSymbol(2, 1, 2))
      .addSymbol(new HouseSymbol(3, 1, 2))
      .addSymbol(new HouseSymbol(1, 2, 2))
  );

  /**
   * **Houses must connect to exactly one other house**
   *
   * @param x - The x-coordinate of the symbol.
   * @param y - The y-coordinate of the symbol.
   * @param number - The number of houses in this region.
   */
  public constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly number: number
  ) {
    super(x, y, number);
  }

  public get id(): string {
    return `house`;
  }

  public get explanation(): string {
    return '*House numbers* count the number of houses in the region';
  }

  public get configs(): readonly AnyConfig[] | null {
    return HouseSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return HouseSymbol.EXAMPLE_GRID;
  }

  public countTiles(
    grid: GridData
  ): { completed: number; possible: number } | null {
    if (!this.validateSubtilePlacement(grid)) return null;

    const thisX = Math.floor(this.x);
    const thisY = Math.floor(this.y);
    const visited = array(grid.width, grid.height, () => false);
    const connected = array(grid.width, grid.height, () => false);
    const color = grid.getTile(thisX, thisY).color;
    if (color === Color.Gray)
      return { completed: 0, possible: Number.MAX_SAFE_INTEGER };
    grid.iterateArea(
      { x: thisX, y: thisY },
      tile => tile.color === Color.Gray || tile.color === color,
      (_, x, y) => {
        visited[y][x] = true;
      }
    );
    grid.iterateArea(
      { x: thisX, y: thisY },
      tile => tile.color === color,
      (_, x, y) => {
        connected[y][x] = true;
      }
    );
    let completedHouses = 0;
    let possibleHouses = 0;
    for (const symbol of grid.symbols.get(this.id) ?? []) {
      if (symbol instanceof HouseSymbol) {
        const symbolX = Math.floor(symbol.x);
        const symbolY = Math.floor(symbol.y);
        if (connected[symbolY][symbolX]) completedHouses++;
        else if (visited[symbolY][symbolX]) possibleHouses++;
      }
    }
    return {
      completed: completedHouses,
      possible: completedHouses + possibleHouses,
    };
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
    return new HouseSymbol(
      x ?? this.x,
      y ?? this.y,
      number ?? this.number
    ) as this;
  }
}

export const instance = new HouseSymbol(0, 0, 2);

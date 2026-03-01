import { AnyConfig, ConfigType } from '../config.js';
import { SymbolMergeHandler } from '../events/onSymbolMerge.js';
import GridData from '../grid.js';
import { Color, Position } from '../primitives.js';
import AreaNumberSymbol from './areaNumberSymbol.js';
import LetterSymbol from './letterSymbol.js';
import NumberSymbol from './numberSymbol.js';
import Symbol from './symbol.js';

const OFFSETS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export default class FocusSymbol
  extends NumberSymbol
  implements SymbolMergeHandler
{
  public get title(): string {
    if (this.deadEnd) {
      return 'Dead End';
    } else {
      return 'Focus Number';
    }
  }

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
      type: ConfigType.Boolean,
      default: false,
      field: 'deadEnd',
      description: 'Dead End',
      explanation:
        'A Dead End is a Focus Number of 1 that can be stacked with other symbols.',
      configurable: true,
    },
    {
      type: ConfigType.Number,
      default: 1,
      field: 'number',
      description: 'Number',
      explanation:
        'Must be 1 for Dead Ends. Between 0 and 4 for Focus Numbers.',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['wwwww', 'bbbbw', 'wwbbw', 'wwwww']).withSymbols([
      new FocusSymbol(0, 0, false, 1),
      new FocusSymbol(4, 1, false, 2),
      new FocusSymbol(1, 3, false, 3),
    ])
  );

  private static readonly EXAMPLE_GRID_DEAD_END = Object.freeze(
    GridData.create(['wwwww', 'bbbbw', 'wwwbw', 'bbbbw']).withSymbols([
      new FocusSymbol(0, 0, true, 1),
      new FocusSymbol(4, 3, true, 1),
      new FocusSymbol(0, 2, true, 1),
      new FocusSymbol(2, 2, true, 1),
      new AreaNumberSymbol(0, 2, 3),
      new LetterSymbol(0, 0, 'A'),
      new LetterSymbol(4, 3, 'A'),
    ])
  );

  /**
   * **Focus Numbers count directly adjacent cells of the same color**
   * @param x - The x-coordinate of the symbol.
   * @param y - The y-coordinate of the symbol.
   * @param deadEnd - Whether this Focus Number is a Dead End.
   * @param number - The focus number.
   */
  public constructor(
    x: number,
    y: number,
    public readonly deadEnd: boolean,
    number: number
  ) {
    if (deadEnd) {
      number = 1;
    }
    super(x, y, number);
    this.deadEnd = deadEnd;
  }

  public get id(): string {
    return `focus`;
  }

  public get placementStep(): number {
    return 1;
  }

  public get explanation(): string {
    if (this.deadEnd) {
      return `*Dead Ends* connect to one adjacent cell of the same color`;
    } else {
      return '*Focus Numbers* count directly adjacent cells of the same color';
    }
  }

  public get configs(): readonly AnyConfig[] | null {
    return FocusSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    if (this.deadEnd) {
      return FocusSymbol.EXAMPLE_GRID_DEAD_END;
    } else {
      return FocusSymbol.EXAMPLE_GRID;
    }
  }

  private countForColor(
    grid: GridData,
    color: Color
  ): { completed: number; possible: number } {
    let gray = 0;
    let same = 0;
    const visited: Position[] = [];
    for (const [dx, dy] of OFFSETS) {
      const x = this.x + dx;
      const y = this.y + dy;
      if (grid.wrapAround.value) {
        const pos = grid.toArrayCoordinates(x, y);
        if (visited.some(v => v.x === pos.x && v.y === pos.y)) continue;
        visited.push(pos);
      }
      const tile = grid.getTile(x, y);
      if (!tile.exists) continue;
      if (tile.color === Color.Gray) gray++;
      else if (tile.color === color) same++;
    }
    return { completed: same, possible: same + gray };
  }

  public countTiles(grid: GridData): { completed: number; possible: number } {
    if (Math.floor(this.x) !== this.x || Math.floor(this.y) !== this.y)
      return { completed: 0, possible: Number.MAX_SAFE_INTEGER };
    const color = grid.getTile(this.x, this.y).color;
    if (color === Color.Gray) {
      const dark = this.countForColor(grid, Color.Dark);
      const light = this.countForColor(grid, Color.Light);
      return {
        completed: Math.min(dark.completed, light.completed),
        possible: Math.max(dark.possible, light.possible),
      };
    }
    return this.countForColor(grid, color);
  }

  public descriptionEquals(other: Symbol): boolean {
    return this.id === other.id && this.explanation === other.explanation;
  }

  public copyWith({
    x,
    y,
    deadEnd,
    number,
  }: {
    x?: number;
    y?: number;
    deadEnd?: boolean;
    number?: number;
  }): this {
    return new FocusSymbol(
      x ?? this.x,
      y ?? this.y,
      deadEnd ?? this.deadEnd,
      number ?? this.number
    ) as this;
  }

  public withNumber(number: number): this {
    return this.copyWith({ number });
  }

  public withDeadEnd(deadEnd: boolean): this {
    return this.copyWith({ deadEnd });
  }
}

export const instance = new FocusSymbol(0, 0, false, 1);

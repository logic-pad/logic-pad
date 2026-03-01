import { AnyConfig, ConfigType } from '../config.js';
import { move } from '../dataHelper.js';
import { SymbolMergeHandler } from '../events/onSymbolMerge.js';
import GridData from '../grid.js';
import {
  Color,
  ORIENTATIONS,
  Orientation,
  OrientationMap,
  OrientationToggle,
  State,
  orientationToggle,
} from '../primitives.js';
import Symbol from './symbol.js';

export default class MyopiaSymbol extends Symbol implements SymbolMergeHandler {
  public get title() {
    return this.diagonals ? 'Framed Myopia Arrow' : 'Myopia Arrow';
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
      field: 'diagonals',
      description: 'Include diagonal directions',
      explanation:
        'Whether to check diagonals as well. Must be enabled for diagonal arrows.',
      configurable: true,
    },
    {
      type: ConfigType.OrientationToggle,
      default: orientationToggle(Orientation.Up, Orientation.Right),
      field: 'directions',
      description: 'Directions',
      explanation:
        'The directions in which an arrow is pointing. A dot will be displayed if no arrows are present.',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['wbwww', 'bwwwb', 'wwwww', 'wbwww']).withSymbols([
      new MyopiaSymbol(
        1,
        1,
        false,
        orientationToggle(Orientation.Up, Orientation.Left)
      ),
      new MyopiaSymbol(4, 3, false, orientationToggle(Orientation.Up)),
    ])
  );

  private static readonly EXAMPLE_DIAGONAL_GRID = Object.freeze(
    GridData.create(['wbwww', 'bwwwb', 'wwwww', 'wbwww']).withSymbols([
      new MyopiaSymbol(
        1,
        2,
        true,
        orientationToggle(Orientation.UpLeft, Orientation.Down)
      ),
      new MyopiaSymbol(3, 2, true, orientationToggle(Orientation.UpRight)),
    ])
  );

  /**
   * **Viewpoint Numbers count visible cells in the four directions**
   * @param x - The x-coordinate of the symbol.
   * @param y - The y-coordinate of the symbol.
   * @param diagonals - Whether the symbol should consider diagonal directions.
   * @param directions - The directions in which an arrow is pointing.
   */
  public constructor(
    x: number,
    y: number,
    public readonly diagonals: boolean,
    public readonly directions: OrientationToggle
  ) {
    super(x, y);
    this.directions = directions;
    this.diagonals =
      directions[Orientation.DownLeft] ||
      directions[Orientation.DownRight] ||
      directions[Orientation.UpLeft] ||
      directions[Orientation.UpRight]
        ? true
        : diagonals;
  }

  public get id(): string {
    return `myopia`;
  }

  public get placementStep(): number {
    return 1;
  }

  public get explanation(): string {
    return this.diagonals
      ? '*Framed myopia arrows* point to *all* the closest opposite cells in 8 directions'
      : '*Myopia arrows* point to *all* the closest cells of the opposite color';
  }

  public get configs(): readonly AnyConfig[] | null {
    return MyopiaSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return this.diagonals
      ? MyopiaSymbol.EXAMPLE_DIAGONAL_GRID
      : MyopiaSymbol.EXAMPLE_GRID;
  }

  public validateSymbol(grid: GridData): State {
    const tile = grid.getTile(this.x, this.y);
    if (!tile.exists || tile.color === Color.Gray) return State.Incomplete;

    const allDirections = this.diagonals
      ? ORIENTATIONS
      : [Orientation.Up, Orientation.Down, Orientation.Left, Orientation.Right];

    const map: OrientationMap<{ min: number; max: number; complete: boolean }> =
      {
        up: { min: 0, max: 0, complete: true },
        down: { min: 0, max: 0, complete: true },
        left: { min: 0, max: 0, complete: true },
        right: { min: 0, max: 0, complete: true },
        'up-left': { min: 0, max: 0, complete: true },
        'up-right': { min: 0, max: 0, complete: true },
        'down-left': { min: 0, max: 0, complete: true },
        'down-right': { min: 0, max: 0, complete: true },
      };
    const pos = { x: this.x, y: this.y };
    allDirections.forEach(direction => {
      let stopped = false;
      grid.iterateDirectionAll(
        move(pos, direction),
        direction,
        t => {
          if (!t.exists) return true;
          if (t.color === tile.color) return true;
          stopped = true;
          return false;
        },
        () => {
          map[direction].min++;
        }
      );
      if (!stopped && map[direction].min === 0)
        map[direction].min = Number.MAX_SAFE_INTEGER;
      stopped = false;
      grid.iterateDirectionAll(
        move(pos, direction),
        direction,
        t => {
          if (!t.exists) return true;
          if (t.color === tile.color || t.color === Color.Gray) return true;
          stopped = true;
          return false;
        },
        t => {
          map[direction].max++;
          if (t.exists && t.color === Color.Gray)
            map[direction].complete = false;
        }
      );
      if (!stopped) map[direction].max = Number.MAX_SAFE_INTEGER;
    });
    const pointedDirections = allDirections.filter(d => this.directions[d]);
    const otherDirections = allDirections.filter(d => !this.directions[d]);
    for (let i = 0; i < pointedDirections.length; i++) {
      const direction1 = pointedDirections[i];
      for (let j = i + 1; j < pointedDirections.length; j++) {
        const direction2 = pointedDirections[j];
        if (map[direction1].min > map[direction2].max) return State.Error;
        if (map[direction2].min > map[direction1].max) return State.Error;
      }
    }
    if (
      Math.min(...otherDirections.map(d => map[d].max)) <=
      Math.max(...pointedDirections.map(d => map[d].min))
    )
      return State.Error;
    if (
      pointedDirections.length === 0 &&
      otherDirections.some(d => map[d].max !== Number.MAX_SAFE_INTEGER)
    )
      return State.Error;
    if (
      pointedDirections.some(
        d => map[d].complete && map[d].max === Number.MAX_SAFE_INTEGER
      )
    )
      return State.Error;
    if (
      pointedDirections.length > 0 &&
      otherDirections.length > 0 &&
      pointedDirections.every(d => map[d].complete) &&
      Math.max(...pointedDirections.map(d => map[d].max)) <
        Math.min(...otherDirections.map(d => map[d].min))
    )
      return State.Satisfied;
    if (allDirections.every(d => map[d].complete)) return State.Satisfied;
    return State.Incomplete;
  }

  public descriptionEquals(other: Symbol): boolean {
    return this.id === other.id && this.explanation === other.explanation;
  }

  public copyWith({
    x,
    y,
    diagonals,
    directions,
  }: {
    x?: number;
    y?: number;
    diagonals?: boolean;
    directions?: OrientationToggle;
  }): this {
    return new MyopiaSymbol(
      x ?? this.x,
      y ?? this.y,
      diagonals ?? this.diagonals,
      directions ?? this.directions
    ) as this;
  }

  public withDirections(directions: OrientationToggle): this {
    return this.copyWith({ directions });
  }

  public withDiagonals(diagonals: boolean): this {
    return this.copyWith({ diagonals });
  }
}

export const instance = new MyopiaSymbol(
  0,
  0,
  false,
  orientationToggle(Orientation.Up, Orientation.Right)
);

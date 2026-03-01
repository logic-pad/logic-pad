import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { array, minBy } from '../dataHelper.js';
import { Color, Position, RuleState, State } from '../primitives.js';
import Rule, { SearchVariant } from './rule.js';

export default class ConnectAllRule extends Rule {
  public readonly title = 'Connect All';

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Color,
      default: Color.Light,
      allowGray: false,
      field: 'color',
      description: 'Color',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID_LIGHT = Object.freeze(
    GridData.create(['bwwwb', 'bwbww', 'wwwbb', 'wbwww'])
  );

  private static readonly EXAMPLE_GRID_DARK = Object.freeze(
    GridData.create(['wbbbw', 'wbwbb', 'bbbww', 'bwbbb'])
  );

  private static readonly SEARCH_VARIANTS = [
    new ConnectAllRule(Color.Light).searchVariant(),
    new ConnectAllRule(Color.Dark).searchVariant(),
  ];

  /**
   * **Connect all &lt;color&gt; cells**
   *
   * @param color - The color of the cells to connect.
   */
  public constructor(public readonly color: Color) {
    super();
    this.color = color;
  }

  public get id(): string {
    return `connect_all`;
  }

  public get explanation(): string {
    return `Connect all ${this.color} cells`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return ConnectAllRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return this.color === Color.Light
      ? ConnectAllRule.EXAMPLE_GRID_LIGHT
      : ConnectAllRule.EXAMPLE_GRID_DARK;
  }

  public get searchVariants(): SearchVariant[] {
    return ConnectAllRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    let complete = true;
    const visited = array(
      grid.width,
      grid.height,
      (i, j) => !grid.getTile(i, j).exists
    );
    const islands: Position[][] = [];
    while (true) {
      const seed = grid.find(
        (tile, x, y) => !visited[y][x] && tile.color === this.color
      );
      if (!seed) break;
      const positions: Position[] = [];
      grid.iterateArea(
        seed,
        tile => tile.color === this.color || tile.color === Color.Gray,
        (tile, x, y) => {
          if (tile.color === Color.Gray) complete = false;
          positions.push({ x, y });
        },
        visited
      );
      islands.push(positions);
    }
    if (islands.length > 1) {
      return {
        state: State.Error,
        positions: minBy(islands, island => island.length)!,
      };
    } else if (islands.length <= 1) {
      return { state: complete ? State.Satisfied : State.Incomplete };
    } else {
      return { state: State.Incomplete }; // not reachable but the TS is not happy
    }
  }

  public copyWith({ color }: { color?: Color }): this {
    return new ConnectAllRule(color ?? this.color) as this;
  }

  public withColor(color: Color): this {
    return this.copyWith({ color });
  }
}

export const instance = new ConnectAllRule(Color.Dark);

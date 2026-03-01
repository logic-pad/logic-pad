import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { array, minBy } from '../dataHelper.js';
import { Color, Position, RuleState, State } from '../primitives.js';
import Rule, { SearchVariant } from './rule.js';
import GridZones from '../gridZones.js';

export default class ConnectZonesRule extends Rule {
  public readonly title = 'Connect Zones';

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
    GridData.create(['wbbwb', 'wbbwb', 'wbbww', 'wwbbb'])
      .withZones(
        new GridZones([
          { x1: 2, y1: 1, x2: 2, y2: 2 },
          { x1: 1, y1: 0, x2: 2, y2: 0 },
          { x1: 1, y1: 1, x2: 2, y2: 1 },
          { x1: 2, y1: 2, x2: 3, y2: 2 },
          { x1: 2, y1: 3, x2: 3, y2: 3 },
        ])
      )
      .addRule(new ConnectZonesRule(Color.Light))
  );

  private static readonly EXAMPLE_GRID_DARK = Object.freeze(
    ConnectZonesRule.EXAMPLE_GRID_LIGHT.withTiles(tiles =>
      tiles.map(row =>
        row.map(tile =>
          tile.withColor(tile.color === Color.Dark ? Color.Light : Color.Dark)
        )
      )
    )
  );

  private static readonly SEARCH_VARIANTS = [
    new ConnectZonesRule(Color.Light).searchVariant(),
    new ConnectZonesRule(Color.Dark).searchVariant(),
  ];

  /**
   * **Connect all &lt;color&gt; cells in each zone**
   *
   * @param color - The color of the cells to connect.
   */
  public constructor(public readonly color: Color) {
    super();
    this.color = color;
  }

  public get id(): string {
    return `connect_zones`;
  }

  public get explanation(): string {
    return `Connect all ${this.color} cells in each zone`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return ConnectZonesRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return this.color === Color.Light
      ? ConnectZonesRule.EXAMPLE_GRID_LIGHT
      : ConnectZonesRule.EXAMPLE_GRID_DARK;
  }

  public get searchVariants(): SearchVariant[] {
    return ConnectZonesRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    let complete = true;
    let zoneId = 1;
    const zoneMap = array(grid.width, grid.height, () => 0);
    const visited = array(
      grid.width,
      grid.height,
      (i, j) => !grid.getTile(i, j).exists
    );
    const zones = grid.reduceByZone(
      (zone, tile, x, y) => {
        zoneMap[y][x] = zone;
        if (tile.exists && tile.color === Color.Gray) {
          complete = false;
        }
        return zone;
      },
      () => zoneId++
    );
    for (const zone of zones) {
      const islands: Position[][] = [];
      while (true) {
        const seed = grid.find(
          (tile, x, y) =>
            !visited[y][x] &&
            zoneMap[y][x] === zone &&
            tile.color === this.color
        );
        if (!seed) break;
        const positions: Position[] = [];
        grid.iterateArea(
          seed,
          (tile, x, y) => {
            if (tile.color !== this.color && tile.color !== Color.Gray) {
              return false;
            }
            const pos = grid.toArrayCoordinates(x, y);
            return zoneMap[pos.y][pos.x] === zone;
          },
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
      }
    }
    return { state: complete ? State.Satisfied : State.Incomplete };
  }

  public copyWith({ color }: { color?: Color }): this {
    return new ConnectZonesRule(color ?? this.color) as this;
  }

  public withColor(color: Color): this {
    return this.copyWith({ color });
  }
}

export const instance = new ConnectZonesRule(Color.Dark);

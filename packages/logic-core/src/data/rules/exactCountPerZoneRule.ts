import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import GridZones from '../gridZones.js';
import { Color, RuleState, State } from '../primitives.js';
import CellCountPerZoneRule from './cellCountPerZoneRule.js';
import { SearchVariant } from './rule.js';

export default class ExactCountPerZoneRule extends CellCountPerZoneRule {
  public readonly title = 'Exact Count Per Zone';

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Color,
      default: Color.Light,
      allowGray: true,
      field: 'color',
      description: 'Color',
      configurable: true,
    },
    {
      type: ConfigType.Number,
      default: 1,
      min: 0,
      field: 'count',
      description: 'Count',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID_LIGHT = Object.freeze(
    GridData.create(['wbbbb', 'bbbwb', 'bbbwb', 'bwbbb'])
      .withZones(
        new GridZones([
          { x1: 0, y1: 1, x2: 0, y2: 2 },
          { x1: 1, y1: 1, x2: 1, y2: 2 },
          { x1: 2, y1: 1, x2: 2, y2: 2 },
          { x1: 3, y1: 1, x2: 3, y2: 2 },
          { x1: 4, y1: 1, x2: 4, y2: 2 },
          { x1: 1, y1: 0, x2: 2, y2: 0 },
          { x1: 1, y1: 1, x2: 2, y2: 1 },
          { x1: 2, y1: 2, x2: 3, y2: 2 },
          { x1: 2, y1: 3, x2: 3, y2: 3 },
        ])
      )
      .addRule(new ExactCountPerZoneRule(Color.Light, 1))
  );

  private static readonly EXAMPLE_GRID_DARK = Object.freeze(
    ExactCountPerZoneRule.EXAMPLE_GRID_LIGHT.withTiles(tiles =>
      tiles.map(row =>
        row.map(tile =>
          tile.withColor(tile.color === Color.Dark ? Color.Light : Color.Dark)
        )
      )
    )
  );

  private static readonly EXAMPLE_GRID_GRAY = Object.freeze(
    ExactCountPerZoneRule.EXAMPLE_GRID_LIGHT.withTiles(tiles =>
      tiles.map(row =>
        row.map(tile =>
          tile.withColor(tile.color === Color.Light ? Color.Gray : tile.color)
        )
      )
    )
  );

  private static readonly SEARCH_VARIANTS = [
    new ExactCountPerZoneRule(Color.Light, 1).searchVariant(),
    new ExactCountPerZoneRule(Color.Dark, 1).searchVariant(),
  ];

  /**
   * **Each zone has &lt;count&gt; &lt;color&gt; cells.**
   *
   * @param color - The color of the cells to count.
   * @param count - The exact count of the cells in each zone.
   */
  public constructor(
    public readonly color: Color,
    public readonly count: number
  ) {
    super(color);
    this.count = count;
  }

  public get id(): string {
    return `zone_exact_count`;
  }

  public get explanation(): string {
    return `Each zone has exactly ${this.count} ${this.color} cell${this.count === 1 ? '' : 's'}`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return ExactCountPerZoneRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    if (this.color === Color.Light) {
      return ExactCountPerZoneRule.EXAMPLE_GRID_LIGHT;
    } else if (this.color === Color.Dark) {
      return ExactCountPerZoneRule.EXAMPLE_GRID_DARK;
    } else {
      return ExactCountPerZoneRule.EXAMPLE_GRID_GRAY;
    }
  }

  public get searchVariants(): SearchVariant[] {
    return ExactCountPerZoneRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    const { zones, complete } = this.getZoneCounts(grid);
    const errorZone = zones.find(
      z => z.completed > this.count || z.completed + z.possible < this.count
    );
    if (errorZone) {
      return {
        state: State.Error,
        positions: errorZone.positions,
      };
    } else {
      return { state: complete ? State.Satisfied : State.Incomplete };
    }
  }

  public copyWith({ color, count }: { color?: Color; count?: number }): this {
    return new ExactCountPerZoneRule(
      color ?? this.color,
      count ?? this.count
    ) as this;
  }
}

export const instance = new ExactCountPerZoneRule(Color.Light, 1);

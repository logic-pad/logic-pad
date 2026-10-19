import { i18n } from '../../locale/index.js';
import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { Color, RuleState, State } from '../primitives.js';
import AreaNumberSymbol from '../symbols/areaNumberSymbol.js';
import Rule, { SearchVariant } from './rule.js';

export default class CellCountRule extends Rule {
  public get title(): string {
    return i18n.t('rule.cell_count.title');
  }

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Color,
      default: Color.Light,
      allowGray: false,
      field: 'color',
      get description(): string {
        return i18n.t('common.color');
      },
      configurable: true,
    },
    {
      type: ConfigType.Number,
      default: 10,
      min: 0,
      field: 'count',
      get description(): string {
        return i18n.t('common.count');
      },
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID_LIGHT = Object.freeze([
    GridData.create(['bbbbb', 'bbbbb', 'bbbbb', 'bbbbb']),
    GridData.create(['bbbbb', 'bbbbb', 'bwbbb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 2, 1),
    ]),
    GridData.create(['bbbbb', 'bbbbb', 'bwwbb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 2, 2),
    ]),
    GridData.create(['bbbbb', 'bwbbb', 'bwwbb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 2, 3),
    ]),
    GridData.create(['bbbbb', 'bwwbb', 'bwwbb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 2, 4),
    ]),
    GridData.create(['bbbbb', 'bwwbb', 'bwwwb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 2, 5),
    ]),
    GridData.create(['bbbbb', 'bwwwb', 'bwwwb', 'bbbbb']).withSymbols([
      new AreaNumberSymbol(1, 2, 6),
    ]),
    GridData.create(['bbbbb', 'bbbbb', 'wwwbb', 'wwwwb']).withSymbols([
      new AreaNumberSymbol(1, 2, 7),
    ]),
    GridData.create(['bbbbb', 'wbbbb', 'wwwbb', 'wwwwb']).withSymbols([
      new AreaNumberSymbol(1, 2, 8),
    ]),
    GridData.create(['bbbbb', 'wwbbb', 'wwwbb', 'wwwwb']).withSymbols([
      new AreaNumberSymbol(1, 2, 9),
    ]),
    GridData.create(['wbbbb', 'wwbbb', 'wwwbb', 'wwwwb']).withSymbols([
      new AreaNumberSymbol(1, 2, 10),
    ]),
  ]);

  private static readonly EXAMPLE_GRID_DARK = Object.freeze(
    CellCountRule.EXAMPLE_GRID_LIGHT.map(grid =>
      grid.withTiles(tiles =>
        tiles.map(row =>
          row.map(tile =>
            tile.withColor(tile.color === Color.Dark ? Color.Light : Color.Dark)
          )
        )
      )
    )
  );

  private static readonly SEARCH_VARIANTS = [
    new CellCountRule(Color.Light, 10).searchVariant(),
    new CellCountRule(Color.Dark, 10).searchVariant(),
  ];

  /**
   * **There are &lt;count&gt; &lt;color&gt; cells in total**
   *
   * @param color - The color of the cells to count.
   * @param count - The total number of cells of the given color.
   */
  public constructor(
    public readonly color: Color,
    public readonly count: number
  ) {
    super();
    this.color = color;
    this.count = count;
  }

  public get id(): string {
    return `cell_count`;
  }

  public get explanation(): string {
    return i18n.t('rule.cell_count.explanation', {
      count: this.count,
      color: this.color,
    });
  }

  public get configs(): readonly AnyConfig[] | null {
    return CellCountRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    if (this.count < CellCountRule.EXAMPLE_GRID_LIGHT.length) {
      if (this.color === Color.Light) {
        return CellCountRule.EXAMPLE_GRID_LIGHT[this.count];
      } else {
        return CellCountRule.EXAMPLE_GRID_DARK[this.count];
      }
    } else {
      const grid =
        this.color === Color.Light
          ? GridData.create(['wbbbb', 'wwbbb', 'wwwbb', 'wwwwb'])
          : GridData.create(['bwwww', 'bbwww', 'bbbww', 'bbbbw']);
      return grid.addSymbol(new AreaNumberSymbol(1, 2, this.count));
    }
  }

  public get searchVariants(): SearchVariant[] {
    return CellCountRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    let colored = 0;
    let possible = 0;
    grid.forEach(tile => {
      if (!tile.exists) return;
      if (tile.color === this.color) colored++;
      if (tile.color === Color.Gray) possible++;
    });
    if (colored > this.count || colored + possible < this.count) {
      return { state: State.Error, positions: [] };
    } else if (colored === this.count && possible === 0) {
      return { state: State.Satisfied };
    } else {
      return { state: State.Incomplete };
    }
  }

  public copyWith({ color, count }: { color?: Color; count?: number }): this {
    return new CellCountRule(color ?? this.color, count ?? this.count) as this;
  }

  public withColor(color: Color): this {
    return this.copyWith({ color });
  }

  public withCount(count: number): this {
    return this.copyWith({ count });
  }
}

export const instance = new CellCountRule(Color.Dark, 10);

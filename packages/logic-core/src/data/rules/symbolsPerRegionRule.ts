import Rule, { SearchVariant } from './rule.js';
import GridData from '../grid.js';
import { AnyConfig, ConfigType } from '../config.js';
import {
  Color,
  Comparison,
  Position,
  RuleState,
  State,
} from '../primitives.js';
import { array } from '../dataHelper.js';
import LetterSymbol from '../symbols/letterSymbol.js';
import Symbol from '../symbols/symbol.js';
import GridConnections from '../gridConnections.js';

export default class SymbolsPerRegionRule extends Rule {
  public readonly title = 'Symbols Per Area';

  private static readonly SYMBOL_POSITIONS = [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 1, y: 2 },
  ];

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Number,
      default: 1,
      field: 'count',
      description: 'Count',
      configurable: true,
    },
    {
      type: ConfigType.Color,
      default: Color.Light,
      field: 'color',
      description: 'Color',
      configurable: true,
      allowGray: true,
    },
    {
      type: ConfigType.Comparison,
      default: Comparison.Equal,
      field: 'comparison',
      description: 'Comparison',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRIDS = {
    [Color.Dark]: GridData.create(['wwwww', 'wbbbw', 'wbbww', 'wwwww']),
    [Color.Light]: GridData.create(['bbbbb', 'bwwwb', 'bwwbb', 'bbbbb']),
    [Color.Gray]: GridData.create(['bwbwb', 'wnnnw', 'bnnwb', 'wbwbw']),
  };

  private static readonly SEARCH_VARIANTS = [
    new SymbolsPerRegionRule(Color.Light, 1).searchVariant(),
    new SymbolsPerRegionRule(Color.Dark, 1).searchVariant(),
    new SymbolsPerRegionRule(
      Color.Light,
      1,
      Comparison.AtLeast
    ).searchVariant(),
    new SymbolsPerRegionRule(Color.Dark, 1, Comparison.AtLeast).searchVariant(),
    new SymbolsPerRegionRule(Color.Light, 1, Comparison.AtMost).searchVariant(),
    new SymbolsPerRegionRule(Color.Dark, 1, Comparison.AtMost).searchVariant(),
  ];

  /**
   * **Exactly &lt;count&gt; symbols per &lt;color&gt; area**
   *
   * @param color - Color of the region affected by the rule
   * @param count - Number of symbols to have in each region
   * @param comparison - Comparison to use when checking the number of symbols
   */
  public constructor(
    public readonly color: Color,
    public readonly count: number,
    public readonly comparison: Comparison = Comparison.Equal
  ) {
    super();
    this.color = color;
    this.count = count;
    this.comparison = comparison;
  }

  public get id(): string {
    return `symbols_per_region`;
  }

  public get explanation(): string {
    switch (this.comparison) {
      case Comparison.AtLeast:
        return `At least ${this.count} symbol${this.count === 1 ? '' : 's'} per ${this.color} area`;
      case Comparison.AtMost:
        return `At most ${this.count} symbol${this.count === 1 ? '' : 's'} per ${this.color} area`;
      default:
        return `Exactly ${this.count} symbol${this.count === 1 ? '' : 's'} per ${this.color} area`;
    }
  }

  public get configs(): readonly AnyConfig[] | null {
    return SymbolsPerRegionRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    if (
      this.count > SymbolsPerRegionRule.SYMBOL_POSITIONS.length ||
      this.comparison !== Comparison.Equal
    ) {
      let description = '';
      switch (this.comparison) {
        case Comparison.AtLeast:
          description = `≥${this.count}X`;
          break;
        case Comparison.AtMost:
          description = `≤${this.count}X`;
          break;
        default:
          description = `${this.count}X`;
          break;
      }
      const symbol = new LetterSymbol(1.5, 1.5, description);
      return SymbolsPerRegionRule.EXAMPLE_GRIDS[this.color]
        .addSymbol(symbol)
        .withConnections(
          GridConnections.create(['.....', '.aa..', '.aa..', '.....'])
        );
    }
    const symbols: Symbol[] = [];
    for (let i = 0; i < this.count; i++) {
      const { x, y } = SymbolsPerRegionRule.SYMBOL_POSITIONS[i];
      symbols.push(new LetterSymbol(x, y, 'X'));
    }
    return SymbolsPerRegionRule.EXAMPLE_GRIDS[this.color].withSymbols(symbols);
  }

  public get searchVariants(): SearchVariant[] {
    return SymbolsPerRegionRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    const visited = array(
      grid.width,
      grid.height,
      (i, j) =>
        !(grid.getTile(i, j).exists && grid.getTile(i, j).color === this.color)
    );
    let complete = true;
    while (true) {
      const seed = grid.find((_tile, x, y) => !visited[y][x]);
      if (!seed) break;
      const completed: Position[] = [];
      const gray: Position[] = [];
      const map = array(grid.width, grid.height, () => false);
      let nbSymbolsIn = 0;
      grid.iterateArea(
        { x: seed.x, y: seed.y },
        tile => tile.color === this.color,
        (_, x, y) => {
          completed.push({ x, y });
          visited[y][x] = true;
        },
        map
      );
      for (const [_, symbols] of grid.symbols) {
        for (const symbol of symbols) {
          if (!symbol.necessaryForCompletion) continue;
          if (
            map[Math.floor(symbol.y)][Math.floor(symbol.x)] ||
            map[Math.floor(symbol.y)][Math.ceil(symbol.x)] ||
            map[Math.ceil(symbol.y)][Math.floor(symbol.x)] ||
            map[Math.ceil(symbol.y)][Math.ceil(symbol.x)]
          ) {
            nbSymbolsIn++;
          }
        }
      }
      if (this.comparison !== Comparison.AtLeast && nbSymbolsIn > this.count) {
        return { state: State.Error, positions: completed };
      }
      let nbSymbolsOut = 0;
      if (this.color === Color.Gray) {
        gray.push(...completed);
        nbSymbolsOut = nbSymbolsIn;
      } else {
        grid.iterateArea(
          { x: seed.x, y: seed.y },
          tile => tile.color === Color.Gray || tile.color === this.color,
          (_, x, y) => {
            gray.push({ x, y });
            map[y][x] = true;
          }
        );
        for (const [_, symbols] of grid.symbols) {
          for (const symbol of symbols) {
            if (!symbol.necessaryForCompletion) continue;
            if (
              map[Math.floor(symbol.y)][Math.floor(symbol.x)] ||
              map[Math.floor(symbol.y)][Math.ceil(symbol.x)] ||
              map[Math.ceil(symbol.y)][Math.floor(symbol.x)] ||
              map[Math.ceil(symbol.y)][Math.ceil(symbol.x)]
            ) {
              nbSymbolsOut++;
            }
          }
        }
      }
      if (this.comparison !== Comparison.AtMost && nbSymbolsOut < this.count) {
        return { state: State.Error, positions: gray };
      }
      if (gray.length !== completed.length) {
        complete = false;
      }
    }
    return complete ? { state: State.Satisfied } : { state: State.Incomplete };
  }

  public copyWith({
    count,
    color,
    comparison,
  }: {
    count?: number;
    color?: Color;
    comparison?: Comparison;
  }): this {
    return new SymbolsPerRegionRule(
      color ?? this.color,
      count ?? this.count,
      comparison ?? this.comparison
    ) as this;
  }

  public withColor(color: Color): this {
    return this.copyWith({ color });
  }

  public withCount(count: number): this {
    return this.copyWith({ count });
  }

  public withComparison(comparison: Comparison): this {
    return this.copyWith({ comparison });
  }
}

export const instance = new SymbolsPerRegionRule(Color.Dark, 1);

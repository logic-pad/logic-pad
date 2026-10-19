import { i18n } from '../../locale/index.js';
import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { Color, RuleState, State } from '../primitives.js';
import RegionShapeRule from './regionShapeRule.js';
import { SearchVariant } from './rule.js';

export default class UniqueShapeRule extends RegionShapeRule {
  public get title(): string {
    return i18n.t('rule.unique_shape.title');
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
  ]);

  private static readonly EXAMPLE_GRID_LIGHT = Object.freeze(
    GridData.create(['bwbww', 'wwbww', 'wbwbb', 'bwwbw'])
  );

  private static readonly EXAMPLE_GRID_DARK = Object.freeze(
    GridData.create(['wbwbb', 'bbwbb', 'bwbww', 'wbbwb'])
  );

  private static readonly SEARCH_VARIANTS = [
    new UniqueShapeRule(Color.Light).searchVariant(),
    new UniqueShapeRule(Color.Dark).searchVariant(),
  ];

  /**
   * **No two &lt;color&gt; areas have the same shape and size**
   *
   * @param color - The color of the regions to compare.
   */
  public constructor(color: Color) {
    super(color);
  }

  public get id(): string {
    return `unique_shape`;
  }

  public get explanation(): string {
    return i18n.t('rule.unique_shape.explanation', {
      color: this.color,
    });
  }

  public get configs(): readonly AnyConfig[] | null {
    return UniqueShapeRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return this.color === Color.Light
      ? UniqueShapeRule.EXAMPLE_GRID_LIGHT
      : UniqueShapeRule.EXAMPLE_GRID_DARK;
  }

  public get searchVariants(): SearchVariant[] {
    return UniqueShapeRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    const { regions, complete } = this.getShapeRegions(grid);
    const errorRegion = regions.find(r => r.count > 1);
    if (errorRegion) {
      return {
        state: State.Error,
        positions: errorRegion.positions,
      };
    } else {
      return { state: complete ? State.Satisfied : State.Incomplete };
    }
  }

  public copyWith({ color }: { color?: Color }): this {
    return new UniqueShapeRule(color ?? this.color) as this;
  }
}

export const instance = new UniqueShapeRule(Color.Dark);

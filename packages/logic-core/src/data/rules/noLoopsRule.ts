import { AnyConfig, ConfigType } from '../config.js';
import GridData, { NEIGHBOR_OFFSETS, NEIGHBOR_OFFSETS_8 } from '../grid.js';
import { array } from '../dataHelper.js';
import { Color, Position, RuleState, State } from '../primitives.js';
import Rule, { SearchVariant } from './rule.js';
import CustomIconSymbol from '../symbols/customIconSymbol.js';

export default class NoLoopsRule extends Rule {
  public readonly title = 'No Loops';

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
    GridData.create(['bwwwb', 'bwbww', 'wwwwb', 'wbbww']).withSymbols([
      new CustomIconSymbol('', GridData.create([]), 1, 0, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 2, 0, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 3, 0, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 3, 1, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 3, 2, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 2, 2, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 1, 2, 'MdClear'),
      new CustomIconSymbol('', GridData.create([]), 1, 1, 'MdClear'),
    ])
  );

  private static readonly EXAMPLE_GRID_DARK = Object.freeze(
    NoLoopsRule.EXAMPLE_GRID_LIGHT.withTiles(tiles =>
      tiles.map(row =>
        row.map(tile =>
          tile.withColor(tile.color === Color.Dark ? Color.Light : Color.Dark)
        )
      )
    )
  );

  private static readonly SEARCH_VARIANTS = [
    new NoLoopsRule(Color.Light).searchVariant(),
    new NoLoopsRule(Color.Dark).searchVariant(),
  ];

  /**
   * **No loops in &lt;color&gt; cells**
   *
   * @param color - The color of the cells to check.
   */
  public constructor(public readonly color: Color) {
    super();
    this.color = color;
  }

  public get id(): string {
    return `no_loops`;
  }

  public get explanation(): string {
    return `*No loops* in ${this.color} cells`;
  }

  public get configs(): readonly AnyConfig[] | null {
    return NoLoopsRule.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return this.color === Color.Light
      ? NoLoopsRule.EXAMPLE_GRID_LIGHT
      : NoLoopsRule.EXAMPLE_GRID_DARK;
  }

  public get searchVariants(): SearchVariant[] {
    return NoLoopsRule.SEARCH_VARIANTS;
  }

  public validateGrid(grid: GridData): RuleState {
    // wrap-around grids require special consideration because the "islands" assumption of the
    // algorithm below does not hold
    if (grid.wrapAround.value) {
      const visited = array(grid.width, grid.height, (i, j) => {
        const tile = grid.getTile(i, j);
        return (
          !tile.exists ||
          (tile.color !== this.color && tile.color !== Color.Gray)
        );
      });
      while (true) {
        const seed = grid.find(
          (tile, x, y) => !visited[y][x] && tile.color === this.color
        );
        if (!seed) break;
        let invalid = false;
        const positions: Position[] = [];
        const stack: [Position, Position | null][] = [[seed, null]];
        while (stack.length > 0) {
          const [{ x, y }, from] = stack.pop()!;
          const { x: arrX, y: arrY } = grid.toArrayCoordinates(x, y);
          positions.push({ x: arrX, y: arrY });
          if (visited[arrY][arrX]) {
            invalid = true;
            continue;
          }
          visited[arrY][arrX] = true;
          for (const offset of NEIGHBOR_OFFSETS) {
            if (-offset.x === from?.x && -offset.y === from?.y) continue;
            const next = { x: x + offset.x, y: y + offset.y };
            if (grid.isPositionValid(next.x, next.y)) {
              const nextTile = grid.getTile(next.x, next.y);
              if (nextTile.exists && nextTile.color === this.color)
                stack.push([next, offset]);
            }
          }
        }
        if (invalid) {
          return {
            state: State.Error,
            positions,
          };
        }
      }
      return {
        state: visited.some(row => row.some(v => !v))
          ? State.Incomplete
          : State.Satisfied,
      };
    }

    // special handling for 2x2 loops
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tlTile = grid.getTile(x, y);
        const trTile = grid.getTile(x + 1, y);
        const blTile = grid.getTile(x, y + 1);
        const brTile = grid.getTile(x + 1, y + 1);
        if (
          tlTile.exists &&
          tlTile.color === this.color &&
          trTile.exists &&
          trTile.color === this.color &&
          blTile.exists &&
          blTile.color === this.color &&
          brTile.exists &&
          brTile.color === this.color
        ) {
          const positions: Position[] = [
            grid.toArrayCoordinates(x, y),
            grid.toArrayCoordinates(x + 1, y),
            grid.toArrayCoordinates(x, y + 1),
            grid.toArrayCoordinates(x + 1, y + 1),
          ];
          return {
            state: State.Error,
            positions,
          };
        }
      }
    }

    // general case for non-wrap-around grids: a loop must form an elcosed island that does not touch the grid edge
    const visited = array(grid.width, grid.height, (i, j) => {
      const tile = grid.getTile(i, j);
      return tile.exists && tile.color === this.color;
    });
    const shape = array(grid.width, grid.height, () => false);
    let complete = true;
    while (true) {
      const seed = grid.find(
        (tile, x, y) =>
          !visited[y][x] && (!tile.exists || tile.color !== this.color)
      );
      shape.forEach(row => row.fill(false));
      if (!seed) break;
      let isIsland = true;
      const stack: Position[] = [seed];
      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        const { x: arrX, y: arrY } = grid.toArrayCoordinates(x, y);
        const tile = grid.getTile(x, y);
        if (tile.exists && tile.color === Color.Gray) {
          complete = false;
        }
        if (visited[arrY][arrX]) {
          continue;
        }
        visited[arrY][arrX] = true;
        for (const offset of NEIGHBOR_OFFSETS_8) {
          const next = { x: x + offset.x, y: y + offset.y };
          const arrPos = grid.toArrayCoordinates(next.x, next.y);
          if (grid.isPositionValid(next.x, next.y)) {
            const nextTile = grid.getTile(next.x, next.y);
            shape[arrPos.y][arrPos.x] = true;
            if (!nextTile.exists || nextTile.color !== this.color) {
              stack.push(arrPos);
            }
          } else {
            isIsland = false;
          }
        }
      }
      if (isIsland) {
        const loopPositions: Position[] = [];
        for (let y = 0; y < grid.height; y++) {
          for (let x = 0; x < grid.width; x++) {
            if (shape[y][x]) {
              if (
                x > 0 &&
                y > 0 &&
                x < grid.width - 1 &&
                y < grid.height - 1 &&
                shape[y][x - 1] &&
                shape[y - 1][x] &&
                shape[y][x + 1] &&
                shape[y + 1][x] &&
                shape[y - 1][x - 1] &&
                shape[y - 1][x + 1] &&
                shape[y + 1][x - 1] &&
                shape[y + 1][x + 1]
              )
                continue;
              loopPositions.push({ x, y });
            }
          }
        }
        return {
          state: State.Error,
          positions: loopPositions,
        };
      }
    }
    return {
      state: complete ? State.Satisfied : State.Incomplete,
    };
  }

  public copyWith({ color }: { color?: Color }): this {
    return new NoLoopsRule(color ?? this.color) as this;
  }

  public withColor(color: Color): this {
    return this.copyWith({ color });
  }
}

export const instance = new NoLoopsRule(Color.Dark);

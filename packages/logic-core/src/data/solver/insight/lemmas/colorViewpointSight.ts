import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import ViewpointSymbol, {
  instance as viewpointInstance,
} from '../../../symbols/viewpointSymbol.js';
import { cell, modifyTiles, setColor, setOppositeColor } from '../helper.js';
import { Color, Direction, DIRECTIONS, Position } from '../../../primitives.js';
import { move } from '../../../dataHelper.js';

interface DirectionInfo {
  direction: Direction;
  /** Number of contiguous same-colored cells seen from the symbol in this direction. */
  run: number;
  /** All cells in the contiguous same-color-or-gray run in this direction, nearest first. */
  possible: Position[];
}

/**
 * Forces the cells in a viewpoint's line of sight whose color is decided by the viewpoint's count.
 *
 * A viewpoint sees a contiguous run of its own color in each of the four directions, plus its own
 * cell.
 *
 * 1. A gray cell that sits `i` cells into a run of length `L` hides `L - i` cells (itself and
 *    everything beyond it) if it is colored with the opposite color. When that loss is larger than
 *    the number of cells the viewpoint could otherwise afford to lose, the cell cannot be the
 *    opposite color, so it must match the viewpoint.
 * 2. Conversely, coloring a gray cell with the viewpoint's color extends the run in its direction
 *    to the next blocking cell, which may reach past cells that are already colored. When the
 *    resulting count exceeds the viewpoint's number, the cell must be the opposite color.
 *
 * Both deductions act on the whole merged tile that holds the cell.
 */
export default class ColorViewpointSight extends InsightLemma {
  public readonly id = 'color-viewpoint-sight';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === viewpointInstance.id);
  }

  public apply(context: InsightContext): boolean {
    for (const symbol of context.grid.symbols.get(viewpointInstance.id) ?? []) {
      if (
        Math.floor(symbol.x) !== symbol.x ||
        Math.floor(symbol.y) !== symbol.y
      )
        continue;
      const position = { x: symbol.x, y: symbol.y };
      const originTile = context.grid.getTile(position.x, position.y);
      if (!originTile.exists || originTile.color === Color.Gray) continue;
      const color = originTile.color;
      const number = (symbol as ViewpointSymbol).number;
      const directions = DIRECTIONS.map(direction =>
        this.analyzeDirection(context.grid, position, direction, color)
      );
      const possible =
        1 + directions.reduce((count, info) => count + info.possible.length, 0);
      const completed =
        1 + directions.reduce((count, info) => count + info.run, 0);
      if (completed > number)
        throw this.error(
          `Viewpoint number at ${cell(position)} already sees ${completed} cells, which is more than its number ${number}`
        );
      if (possible < number)
        throw this.error(
          `Viewpoint number at ${cell(position)} can see at most ${possible} cells, which is fewer than its number ${number}`
        );

      if (
        this.forceVisible(
          context,
          position,
          color,
          number,
          possible - number,
          directions
        )
      )
        return true;
      if (this.forceBlocked(context, position, color, number, directions))
        return true;
    }
    return false;
  }

  /**
   * Colors the gray cells that the viewpoint cannot afford to lose, because the cells they would
   * hide are more than the slack between what is visible at most and the number.
   */
  private forceVisible(
    context: InsightContext,
    position: Position,
    color: Color,
    number: number,
    slack: number,
    directions: DirectionInfo[]
  ): boolean {
    const grid = context.grid;
    const forced: Position[] = [];
    for (const info of directions) {
      const length = info.possible.length;
      for (let index = 0; index < length && length - index > slack; index++) {
        const pos = info.possible[index];
        const tile = grid.getTile(pos.x, pos.y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        if (!this.canColor(grid, pos, color)) continue;
        forced.push(pos);
      }
    }
    if (forced.length === 0) return false;

    const newTiles = modifyTiles(grid);
    const modified: Position[] = [];
    const seen = new Set<string>();
    for (const pos of forced) {
      setColor(grid, newTiles, pos.x, pos.y, color);
      for (const tile of grid.connections.getConnectedTiles(pos)) {
        const key = `${tile.x},${tile.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const current = grid.getTile(tile.x, tile.y);
        if (current.exists && !current.fixed && current.color === Color.Gray)
          modified.push(tile);
      }
    }

    context.setTiles(
      newTiles,
      this.proof()
        .difficulty(2)
        .describe(
          `Cells at ${cell(modified)} must be ${color} because otherwise the viewpoint at ${cell(position)} could not see its ${number} cells`
        )
    );
    return true;
  }

  /**
   * Colors the gray cells that would make the viewpoint see more cells than its number if they
   * took its color.
   */
  private forceBlocked(
    context: InsightContext,
    position: Position,
    color: Color,
    number: number,
    directions: DirectionInfo[]
  ): boolean {
    const grid = context.grid;
    const candidates = new Map<string, Position>();
    for (const info of directions) {
      for (const pos of info.possible) {
        const tile = grid.getTile(pos.x, pos.y);
        if (!tile.exists || tile.color !== Color.Gray) continue;
        candidates.set(`${pos.x},${pos.y}`, pos);
      }
    }

    for (const pos of candidates.values()) {
      const merged = grid.connections.getConnectedTiles(pos);
      if (merged.some(p => grid.getTile(p.x, p.y).fixed)) continue;
      const revealed = this.visibleCount(
        grid,
        position,
        color,
        new Set(merged.map(p => `${p.x},${p.y}`))
      );
      if (revealed <= number) continue;

      const newTiles = modifyTiles(grid);
      const modified: Position[] = [];
      for (const target of merged) {
        setOppositeColor(grid, newTiles, target.x, target.y, color);
        modified.push(target);
      }
      context.setTiles(
        newTiles,
        this.proof()
          .difficulty(2)
          .describe(
            `Cells at ${cell(modified)} must be ${
              color === Color.Dark ? Color.Light : Color.Dark
            } because the viewpoint at ${cell(position)} would see ${revealed} cells if they were ${color}, more than its number ${number}`
          )
      );
      return true;
    }
    return false;
  }

  /**
   * The number of cells the viewpoint would see if the cells in `asColor` shared its color.
   */
  private visibleCount(
    grid: GridData,
    position: Position,
    color: Color,
    asColor: ReadonlySet<string>
  ): number {
    let total = 1;
    for (const direction of DIRECTIONS) {
      let current = move(position, direction);
      while (grid.isPositionValid(current.x, current.y)) {
        const tile = grid.getTile(current.x, current.y);
        if (!tile.exists) break;
        const effective = asColor.has(`${current.x},${current.y}`)
          ? color
          : tile.color;
        if (effective !== color) break;
        total++;
        current = move(current, direction);
      }
    }
    return total;
  }

  /** Whether the merged tile holding the given cell can be recolored to `color`. */
  private canColor(grid: GridData, pos: Position, color: Color): boolean {
    for (const tile of grid.connections.getConnectedTiles(pos)) {
      const current = grid.getTile(tile.x, tile.y);
      if (current.fixed && current.color !== color) return false;
    }
    return true;
  }

  private analyzeDirection(
    grid: GridData,
    position: Position,
    direction: Direction,
    color: Color
  ): DirectionInfo {
    let run = 0;
    const possible: Position[] = [];
    let graySeen = false;
    let current = move(position, direction);
    while (grid.isPositionValid(current.x, current.y)) {
      const tile = grid.getTile(current.x, current.y);
      if (!tile.exists || (tile.color !== color && tile.color !== Color.Gray))
        break;
      possible.push({ x: current.x, y: current.y });
      if (tile.color === Color.Gray) {
        graySeen = true;
      } else if (!graySeen) {
        run++;
      }
      current = move(current, direction);
    }
    return { direction, run, possible };
  }
}

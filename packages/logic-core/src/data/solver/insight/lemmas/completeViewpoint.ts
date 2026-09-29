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
  /** Gray cells within the possible run, nearest first. */
  grayCells: Position[];
}

/**
 * Completes viewpoint numbers by directly counting visible cells in the four directions:
 *
 * 1. If the total available space in the four directions equals the number, all of it must be
 *    visible, so every gray cell in it is filled with the symbol's color.
 * 2. If only one direction still has potential space, the number must be fully expanded in that
 *    direction, so the nearest gray cells there are filled with the symbol's color.
 * 3. If the number is complete, every direction must end with an opposite-colored cell or no cell,
 *    so gray cells right after a completed run are filled with the opposite color.
 */
export default class CompleteViewpoint extends InsightLemma {
  public readonly id = 'complete-viewpoint';

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
      const completed =
        1 + directions.reduce((count, info) => count + info.run, 0);
      const possible =
        1 + directions.reduce((count, info) => count + info.possible.length, 0);

      if (completed === number) {
        // The viewpoint is complete: cap every direction that does not already end with
        // an opposite-colored cell or no cell.
        const toCap: Position[] = [];
        for (const info of directions) {
          // The cell right after the completed run is gray iff the possible run is longer.
          if (info.possible.length > info.run)
            toCap.push(info.possible[info.run]);
        }
        if (toCap.length === 0) continue;
        const newTiles = modifyTiles(context.grid);
        for (const pos of toCap) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
          setOppositeColor(context.grid, newTiles, pos.x, pos.y, color);
        }
        context.setTiles(
          newTiles,
          this.proof()
            .difficulty(1)
            .describe(
              `Viewpoint number at ${cell(position)} is complete, so cells at ${cell(toCap)} must block its view`
            )
        );
        return true;
      }

      if (possible === number) {
        // All available space must be visible to reach the number.
        const toFill = directions.flatMap(info => info.grayCells);
        if (toFill.length === 0) continue;
        const newTiles = modifyTiles(context.grid);
        for (const pos of toFill) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
          setColor(context.grid, newTiles, pos.x, pos.y, color);
        }
        context.setTiles(
          newTiles,
          this.proof()
            .difficulty(1)
            .describe(
              `Viewpoint number at ${cell(position)} needs all available space to see ${number} cells, so cells at ${cell(toFill)} must be ${color}`
            )
        );
        return true;
      }

      const growable = directions.filter(info => info.grayCells.length > 0);
      if (growable.length === 1) {
        // Only one direction can still grow, so the remaining cells must all be there.
        const info = growable[0];
        const target = info.run + (number - completed);
        if (target > info.possible.length) continue;
        const toFill = info.possible
          .slice(0, target)
          .filter(
            pos => context.grid.getTile(pos.x, pos.y).color === Color.Gray
          );
        if (toFill.length === 0) continue;
        const newTiles = modifyTiles(context.grid);
        for (const pos of toFill) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
          setColor(context.grid, newTiles, pos.x, pos.y, color);
        }
        context.setTiles(
          newTiles,
          this.proof()
            .difficulty(2)
            .describe(
              `Viewpoint number at ${cell(position)} can only grow ${info.direction} to see ${number} cells, so cells at ${cell(toFill)} must be ${color}`
            )
        );
        return true;
      }
    }
    return false;
  }

  private analyzeDirection(
    grid: GridData,
    position: Position,
    direction: Direction,
    color: Color
  ): DirectionInfo {
    let run = 0;
    const possible: Position[] = [];
    const grayCells: Position[] = [];
    let current = move(position, direction);
    while (grid.isPositionValid(current.x, current.y)) {
      const tile = grid.getTile(current.x, current.y);
      if (!tile.exists || (tile.color !== color && tile.color !== Color.Gray))
        break;
      possible.push({ x: current.x, y: current.y });
      if (tile.color === Color.Gray) {
        grayCells.push({ x: current.x, y: current.y });
      } else if (grayCells.length === 0) {
        run++;
      }
      current = move(current, direction);
    }
    return { direction, run, possible, grayCells };
  }
}

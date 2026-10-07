import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import ViewpointSymbol, {
  instance as viewpointInstance,
} from '../../../symbols/viewpointSymbol.js';
import {
  cell,
  modifyTiles,
  orList,
  setColor,
  setOppositeColor,
} from '../helper.js';
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
 *
 * Under an off-by-X rule the viewpoint admits two values, so each is eliminated when the counted
 * range cannot reach it, and the rules that need an exact number only fire once a single value
 * survives. The other two gate on the extreme surviving values, which holds for every candidate.
 */
export default class CompleteViewpoint extends InsightLemma {
  public readonly id = 'complete-viewpoint';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === viewpointInstance.id);
  }

  public apply(context: InsightContext): boolean {
    for (const symbol of context.grid.symbols.get(viewpointInstance.id) ?? []) {
      if (this.applyToSymbol(context, symbol as ViewpointSymbol)) return true;
    }
    return false;
  }

  private applyToSymbol(
    context: InsightContext,
    viewpoint: ViewpointSymbol
  ): boolean {
    if (
      Math.floor(viewpoint.x) !== viewpoint.x ||
      Math.floor(viewpoint.y) !== viewpoint.y
    )
      return false;
    const position = { x: viewpoint.x, y: viewpoint.y };
    const originTile = context.grid.getTile(position.x, position.y);
    if (!originTile.exists || originTile.color === Color.Gray) return false;
    const color = originTile.color;
    const directions = DIRECTIONS.map(direction =>
      this.analyzeDirection(context.grid, position, direction, color)
    );
    const completed =
      1 + directions.reduce((count, info) => count + info.run, 0);
    const possible =
      1 + directions.reduce((count, info) => count + info.possible.length, 0);

    const values = context.numbers.getPossibilities(viewpoint);
    if (!values) return false;
    let progressed = false;
    for (const value of values) {
      if (value >= completed && value <= possible) continue;
      const legacy =
        value < completed
          ? `Viewpoint number at ${cell(position)} already sees ${completed} cells, which is more than its number ${value}`
          : `Viewpoint number at ${cell(position)} can see at most ${possible} cells, which is fewer than its number ${value}`;
      if (values.length === 1) throw this.error(legacy);
      if (
        context.numbers.eliminatePossibility(
          viewpoint,
          value,
          this.proof()
            .difficulty(1)
            .describe(
              value < completed
                ? `Viewpoint number at ${cell(position)} cannot be ${value} because it already sees ${completed} cells`
                : `Viewpoint number at ${cell(position)} cannot be ${value} because it can see at most ${possible} cells`
            )
        )
      )
        progressed = true;
    }
    const remaining = context.numbers.getPossibilities(viewpoint);
    if (!remaining || remaining.length === 0)
      throw this.error(
        `Viewpoint number at ${cell(position)} has no possible value left: it sees ${completed} cells and can reach ${possible}`
      );
    if (progressed) return true;
    const minimum = Math.min(...remaining);
    const maximum = Math.max(...remaining);

    if (completed === maximum) {
      // The viewpoint is complete: cap every direction that does not already end with
      // an opposite-colored cell or no cell.
      const toCap: Position[] = [];
      for (const info of directions) {
        // The cell right after the completed run is gray iff the possible run is longer.
        if (info.possible.length > info.run)
          toCap.push(info.possible[info.run]);
      }
      if (toCap.length === 0) return false;
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

    if (possible === minimum) {
      // All available space must be visible to reach the number.
      const toFill = directions.flatMap(info => info.grayCells);
      if (toFill.length === 0) return false;
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
            `Viewpoint number at ${cell(position)} needs all available space to see ${orList(remaining)} cells, so cells at ${cell(toFill)} must be ${color}`
          )
      );
      return true;
    }

    if (minimum !== maximum) return false;
    const growable = directions.filter(info => info.grayCells.length > 0);
    if (growable.length !== 1) return false;
    // Only one direction can still grow, so the remaining cells must all be there.
    const info = growable[0];
    const target = info.run + (minimum - completed);
    if (target > info.possible.length) return false;
    const toFill = info.possible
      .slice(0, target)
      .filter(pos => context.grid.getTile(pos.x, pos.y).color === Color.Gray);
    if (toFill.length === 0) return false;
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
          `Viewpoint number at ${cell(position)} can only grow ${info.direction} to see ${minimum} cells, so cells at ${cell(toFill)} must be ${color}`
        )
    );
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

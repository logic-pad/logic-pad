import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import LotusSymbol, {
  instance as lotusInstance,
} from '../../../symbols/lotusSymbol.js';
import { Region } from '../stores/regionStore.js';
import { area, cell, modifyTiles } from '../helper.js';
import { Color, Orientation, Position } from '../../../primitives.js';

type AxisFamily = 'vertical' | 'horizontal' | 'up-right' | 'down-right';

interface Axis {
  family: AxisFamily;
  /**
   * The position of the axis, expressed as `x` for vertical axes, `y` for horizontal ones,
   * `x + y` for up-right ones, and `x - y` for down-right ones.
   */
  offset: number;
}

/**
 * Completes lotus symbols by enforcing the reflection symmetry of the regions that contain them.
 *
 * Unlike galaxies, which cannot share a region because a shape has at most one center of
 * rotational symmetry, several lotuses can describe the same region as long as their axes are
 * compatible: parallel axes must coincide, and non-parallel axes simply add further constraints.
 *
 * 1. Every cell of the region must have a mirror that exists and belongs to the region, and
 *    mirrored cells must share the region's color, otherwise the grid is in an invalid state.
 * 2. A gray cell of the region whose mirror is already colored must take that color.
 * 3. Mirroring is an involution, so a gray cell whose mirror belongs to the region must join it
 *    and take its color.
 * 4. A gray cell adjacent to the region whose mirror is known to be outside the region cannot
 *    join the region, so it must take the opposite color.
 */
export default class CompleteLotus extends InsightLemma {
  public readonly id = 'complete-lotus';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === lotusInstance.id);
  }

  public apply(context: InsightContext): boolean {
    for (const region of context.regions.regions.values()) {
      for (const lotus of this.distinctAxes(region)) {
        if (this.completeForLotus(context, region, lotus)) return true;
      }
    }
    return false;
  }

  /**
   * Returns one lotus per axis of symmetry of the region, throwing when two lotuses describe
   * distinct parallel axes, which no finite region could be symmetrical across.
   */
  private distinctAxes(region: Region): LotusSymbol[] {
    const axes = new Map<AxisFamily, { lotus: LotusSymbol; axis: Axis }>();
    for (const symbol of region.symbols) {
      if (symbol.id !== lotusInstance.id) continue;
      const lotus = symbol as LotusSymbol;
      const axis = CompleteLotus.axisOf(lotus);
      if (!axis) continue;
      const existing = axes.get(axis.family);
      if (!existing) {
        axes.set(axis.family, { lotus, axis });
      } else if (existing.axis.offset !== axis.offset) {
        throw this.error(
          `Region ${area(region.positions[0])} cannot be completed because the lotus symbols at ${cell(existing.lotus)} and ${cell(lotus)} have distinct parallel ${axis.family} axes of symmetry`
        );
      }
    }
    return [...axes.values()].map(entry => entry.lotus);
  }

  private completeForLotus(
    context: InsightContext,
    region: Region,
    lotus: LotusSymbol
  ): boolean {
    const grid = context.grid;
    const map = region.getRegionMap();
    const inRegion = (x: number, y: number): boolean | null => {
      if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return false;
      return map[y][x];
    };
    const regionName = `Region ${area(region.positions[0])}`;
    const mirrorOf = (pos: Position) =>
      CompleteLotus.mirrorOf(lotus, pos.x, pos.y);

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] !== true) continue;
        const target = mirrorOf({ x, y });
        const tile = grid.getTile(target.x, target.y);
        if (!tile.exists)
          throw this.error(
            `${regionName} cannot be completed because the cell mirrored from ${cell({ x, y })} across the lotus at ${cell(lotus)} does not exist`
          );
        if (inRegion(target.x, target.y) === false)
          throw this.error(
            `${regionName} cannot be completed because the cell mirrored from ${cell({ x, y })} across the lotus at ${cell(lotus)} is outside the region`
          );
        if (
          region.color !== Color.Gray &&
          tile.color !== Color.Gray &&
          tile.color !== region.color
        )
          throw this.error(
            `${regionName} cannot be completed because the cell mirrored from ${cell({ x, y })} across the lotus at ${cell(lotus)} is ${tile.color} instead of ${region.color}`
          );
      }
    }

    const proof = this.proof().difficulty(1);
    context.regions.explainRegion(region, proof);

    {
      const modified: Position[] = [];
      const newTiles = modifyTiles(grid, (x, y, { get, setColor }) => {
        const tile = get(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray)
          return tile;
        if (inRegion(x, y) !== true) return tile;
        const target = mirrorOf({ x, y });
        if (inRegion(target.x, target.y) !== true) return tile;
        const opposite = grid.getTile(target.x, target.y);
        if (opposite.color === Color.Gray) return tile;
        setColor(x, y, opposite.color);
        modified.push({ x, y });
        return tile;
      });
      if (modified.length > 0) {
        context.setTiles(
          newTiles,
          proof
            .copy()
            .describe(
              `Cells at ${cell(modified)} must match the cells mirrored from them across the lotus at ${cell(lotus)}`
            )
        );
        return true;
      }
    }

    if (region.color === Color.Gray) return false;

    {
      // Mirroring is an involution, so a cell whose mirror is in the region must be in it too.
      const modified: Position[] = [];
      const newTiles = modifyTiles(grid, (x, y, { get, setColor }) => {
        const tile = get(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray)
          return tile;
        if (inRegion(x, y) !== null) return tile;
        const target = mirrorOf({ x, y });
        if (inRegion(target.x, target.y) !== true) return tile;
        setColor(x, y, region.color);
        modified.push({ x, y });
        return tile;
      });
      if (modified.length > 0) {
        context.setTiles(
          newTiles,
          proof
            .copy()
            .difficulty(2)
            .describe(
              `Cells at ${cell(modified)} must join the region because their mirrors across the lotus at ${cell(lotus)} belong to it`
            )
        );
        return true;
      }
    }

    {
      const modified: Position[] = [];
      const newTiles = modifyTiles(grid, (x, y, { get, setOppositeColor }) => {
        const tile = get(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray)
          return tile;
        if (inRegion(x, y) === true) return tile;
        const target = mirrorOf({ x, y });
        if (inRegion(target.x, target.y) !== false) return tile;
        const isAdjacent =
          inRegion(x - 1, y) === true ||
          inRegion(x + 1, y) === true ||
          inRegion(x, y - 1) === true ||
          inRegion(x, y + 1) === true;
        if (!isAdjacent) return tile;
        setOppositeColor(x, y, region.color);
        modified.push({ x, y });
        return tile;
      });
      if (modified.length > 0) {
        context.setTiles(
          newTiles,
          proof
            .copy()
            .describe(
              `Cells at ${cell(modified)} must not join the region because their mirrored cells are outside it`
            )
        );
        return true;
      }
    }

    return false;
  }

  /**
   * The mirror of a cell across the axis of the given lotus.
   */
  private static mirrorOf(lotus: LotusSymbol, x: number, y: number): Position {
    switch (lotus.orientation) {
      case Orientation.Up:
      case Orientation.Down:
        return { x: 2 * lotus.x - x, y };
      case Orientation.Right:
      case Orientation.Left:
        return { x, y: 2 * lotus.y - y };
      case Orientation.UpRight:
      case Orientation.DownLeft:
        return { x: lotus.x + lotus.y - y, y: lotus.x + lotus.y - x };
      case Orientation.DownRight:
      case Orientation.UpLeft:
        return { x: lotus.x - lotus.y + y, y: lotus.y - lotus.x + x };
    }
  }

  /**
   * The axis of symmetry described by the given lotus, or null when it is placed so that the axis
   * does not map cell centers onto cell centers.
   */
  private static axisOf(lotus: LotusSymbol): Axis | null {
    const mirror = CompleteLotus.mirrorOf(lotus, 0, 0);
    if (mirror.x % 1 !== 0 || mirror.y % 1 !== 0) return null;
    switch (lotus.orientation) {
      case Orientation.Up:
      case Orientation.Down:
        return { family: 'vertical', offset: lotus.x };
      case Orientation.Right:
      case Orientation.Left:
        return { family: 'horizontal', offset: lotus.y };
      case Orientation.UpRight:
      case Orientation.DownLeft:
        return { family: 'up-right', offset: lotus.x + lotus.y };
      case Orientation.DownRight:
      case Orientation.UpLeft:
        return { family: 'down-right', offset: lotus.x - lotus.y };
    }
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { instance as regionAreaInstance } from '../../../rules/regionAreaRule.js';
import { area, modifyTiles } from '../helper.js';
import { Color } from '../../../primitives.js';

/**
 * Completes regions whose size is constrained, whether by an area number symbol or by a region
 * area size rule, using the region size store to obtain the possible sizes.
 *
 * If the region needs at least as many cells as are available, every available cell must belong to
 * it. If the region can hold at most as many cells as it already has, it is complete and must be
 * surrounded by the opposite color.
 */
export default class CompleteRegionSize extends InsightLemma {
  public readonly id = 'complete-region-size';

  public isApplicable(grid: GridData): boolean {
    return (
      !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id) ||
      !!grid.findRule(rule => rule.id === regionAreaInstance.id)
    );
  }

  public apply(context: InsightContext): boolean {
    const regionSizes = context.regionSizes;
    const regions = context.regions;
    for (const region of regions.regions.values()) {
      if (region.color === Color.Gray) continue;
      if (!regionSizes.getPossibilities(region)) continue;
      const position = region.positions[0];
      const proof = this.proof().difficulty(1);
      const regionMap = region.getRegionMap();
      regions.explainRegion(region, proof, region.positions);
      const flatMap = regionMap.flat();
      const maxComplete = flatMap.reduce(
        (count, cell) => count + (cell || cell === null ? 1 : 0),
        0
      );
      const minComplete = flatMap.reduce(
        (count, cell) => count + (cell ? 1 : 0),
        0
      );
      const minPossible = regionSizes.minPossible(region, proof);
      if (minPossible > maxComplete) {
        throw this.error(
          `Region at ${area(position)} cannot be completed because the minimum possible size is ${minPossible} but there are at most ${maxComplete} cells in the region`
        );
      }
      if (minPossible === maxComplete && maxComplete > minComplete) {
        const newTiles = modifyTiles(
          context.grid,
          (x, y, { get, setColor }) => {
            const tile = get(x, y);
            if (regionMap[y][x] !== false && tile.exists && !tile.fixed) {
              setColor(x, y, region.color);
            }
            return tile;
          }
        );
        context.setTiles(
          newTiles,
          proof.describe(
            `Region at ${area(position)} must be completed with ${minPossible} cells, so all cells in the region must be filled in`
          )
        );
        return true;
      }
      const maxPossible = regionSizes.maxPossible(region, proof);
      if (maxPossible < minComplete) {
        throw this.error(
          `Region at ${area(position)} cannot be completed because the maximum possible size is ${maxPossible} but there are at least ${minComplete} completed cells in the region`
        );
      }
      if (maxPossible === minComplete && maxComplete > minComplete) {
        const newTiles = modifyTiles(
          context.grid,
          (x, y, { get, setOppositeColor }) => {
            const tile = get(x, y);
            if (
              tile.exists &&
              !tile.fixed &&
              tile.color === Color.Gray &&
              regionMap[y][x] !== true
            ) {
              let isNeighboring = false;
              isNeighboring ||= y > 0 && !!regionMap[y - 1][x];
              isNeighboring ||=
                y < context.grid.height - 1 && !!regionMap[y + 1][x];
              isNeighboring ||= x > 0 && !!regionMap[y][x - 1];
              isNeighboring ||=
                x < context.grid.width - 1 && !!regionMap[y][x + 1];
              if (isNeighboring) {
                setOppositeColor(x, y, region.color);
              }
            }
            return tile;
          }
        );
        context.setTiles(
          newTiles,
          proof.describe(
            `Region at ${area(position)} is complete and must be surrounded`
          )
        );
        return true;
      }
    }
    return false;
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { cell, modifyTiles } from '../helper.js';
import { Color } from '../../../primitives.js';

export default class CompleteAreaNumber extends InsightLemma {
  public readonly id = 'complete-area-number';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const numberSymbols = context.numberSymbols;
    const regions = context.regions;
    let progress = false;
    for (const [idx, symbol] of context.grid.symbols
      .get(areaNumberInstance.id)
      ?.entries() ?? []) {
      const position = {
        x: Math.floor(symbol.x),
        y: Math.floor(symbol.y),
      };
      const originTile = context.grid.getTile(position.x, position.y);
      if (!originTile.exists || originTile.color === Color.Gray) continue;
      const tag = numberSymbols.getTag(areaNumberInstance.id, idx);
      const proof = this.proof().difficulty(1);
      const regionMap = regions.get(position)?.getRegionMap(proof);
      if (!regionMap) continue;
      const flatMap = regionMap.flat();
      const maxComplete = flatMap.reduce(
        (count, cell) => count + (cell || cell === null ? 1 : 0),
        0
      );
      const minComplete = flatMap.reduce(
        (count, cell) => count + (cell ? 1 : 0),
        0
      );
      const minPossible = numberSymbols.minPossible(tag, proof);
      if (minPossible > maxComplete) {
        throw this.error(
          `Area number at ${cell(position)} cannot be completed because the minimum possible value is ${minPossible} but there are at least ${maxComplete} cells in the region`
        );
      }
      if (minPossible === maxComplete && maxComplete > minComplete) {
        const newTiles = modifyTiles(
          context.grid,
          (x, y, { get, setColor }) => {
            const tile = get(x, y);
            if (regionMap[y][x] !== false && tile.exists && !tile.fixed) {
              setColor(x, y, originTile.color);
            }
            return tile;
          }
        );
        context.setTiles(
          newTiles,
          proof.describe(
            `Area number at ${cell(position)} must be completed with ${minPossible} cells, so all cells in the region must be filled in`
          )
        );
        progress = true;
        continue;
      }
      const maxPossible = numberSymbols.maxPossible(tag, proof);
      if (maxPossible < minComplete) {
        throw this.error(
          `Area number at ${cell(position)} cannot be completed because the maximum possible value is ${maxPossible} but there are at least ${minComplete} completed cells in the region`
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
                setOppositeColor(x, y, originTile.color);
              }
            }
            return tile;
          }
        );
        context.setTiles(
          newTiles,
          proof.describe(
            `Area number at ${cell(position)} is complete and must be surrounded`
          )
        );
        progress = true;
      }
    }
    return progress;
  }
}

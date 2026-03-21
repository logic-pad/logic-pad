import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import GalaxySymbol, {
  instance as galaxyInstance,
} from '../../../symbols/galaxySymbol.js';
import { cell, modifyTiles } from '../helper.js';
import { Color, Position } from '../../../primitives.js';

export default class CompleteGalaxy extends InsightLemma {
  public readonly id = 'complete-galaxy';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === galaxyInstance.id);
  }

  public apply(context: InsightContext): boolean {
    let progress = false;
    for (const region of context.regions.regions.values()) {
      let galaxy: GalaxySymbol | null = null;
      for (const symbol of region.symbols) {
        if (symbol.id === galaxyInstance.id) {
          if (galaxy) {
            // A 2D shape cannot have multiple centers of rotational symmetry
            throw this.error(
              `Region at ${cell(context.regions.toPosition(region.id))} cannot be completed because it contains multiple galaxy symbols`
            );
          }
          galaxy = symbol as GalaxySymbol;
          break;
        }
      }
      if (!galaxy) continue;
      const proof = this.proof().difficulty(1);
      const map = region.getRegionMap(proof);
      let symmetricColor: Color | null = null;
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x] !== true) continue;
          const oppositeX = galaxy.x + (galaxy.x - x);
          const oppositeY = galaxy.y + (galaxy.y - y);
          const tile = context.grid.getTile(oppositeX, oppositeY);
          if (!tile.exists) {
            throw this.error(
              `Region at ${cell(context.regions.toPosition(region.id))} cannot be completed because the tile opposite to ${cell(
                { x, y }
              )} with respect to the galaxy center does not exist`
            );
          }
          if (tile.color === Color.Gray) continue;
          if (symmetricColor === null) {
            symmetricColor = tile.color;
          } else if (tile.color !== symmetricColor) {
            throw this.error(
              `Region at ${cell(context.regions.toPosition(region.id))} cannot be completed because the tiles opposite to ${cell(
                { x, y }
              )} with respect to the galaxy center have different colors`
            );
          }
        }
      }
      if (symmetricColor === null) continue;
      {
        const modified: Position[] = [];
        const newTiles = modifyTiles(
          context.grid,
          (x, y, { get, setColor }) => {
            const tile = get(x, y);
            if (!tile.exists || tile.fixed || tile.color !== Color.Gray)
              return tile;
            const oppositeX = galaxy.x + (galaxy.x - x);
            const oppositeY = galaxy.y + (galaxy.y - y);
            if (
              oppositeX < 0 ||
              oppositeY < 0 ||
              oppositeX >= context.grid.width ||
              oppositeY >= context.grid.height
            )
              return tile;
            if (map[oppositeY][oppositeX] === true) {
              setColor(x, y, symmetricColor);
              modified.push({ x, y });
            }
            return tile;
          }
        );
        if (modified.length > 0) {
          context.setTiles(
            newTiles,
            proof
              .copy()
              .describe(`Galaxy symbol must be completed at ${cell(modified)}`)
          );
          progress = true;
        }
      }
      {
        const modified: Position[] = [];
        const newTiles = modifyTiles(
          context.grid,
          (x, y, { get, setOppositeColor }) => {
            const tile = get(x, y);
            if (!tile.exists || tile.fixed || tile.color !== Color.Gray)
              return tile;
            const oppositeX = galaxy.x + (galaxy.x - x);
            const oppositeY = galaxy.y + (galaxy.y - y);
            const safeGet = (x: number, y: number): boolean | null => {
              if (
                x < 0 ||
                y < 0 ||
                x >= context.grid.width ||
                y >= context.grid.height
              )
                return false;
              return map[y][x];
            };
            if (safeGet(oppositeX, oppositeY) === false) {
              let isAdjacent = false;
              isAdjacent ||= safeGet(x - 1, y) === true;
              isAdjacent ||= safeGet(x + 1, y) === true;
              isAdjacent ||= safeGet(x, y - 1) === true;
              isAdjacent ||= safeGet(x, y + 1) === true;
              if (isAdjacent) {
                setOppositeColor(x, y, symmetricColor);
                modified.push({ x, y });
              }
            }
            return tile;
          }
        );
        if (modified.length > 0) {
          context.setTiles(
            newTiles,
            proof
              .copy()
              .describe(
                `Cells at ${cell(modified)} must not belong to the galaxy symbol at ${cell(galaxy)} because their opposite cells are not part of the galaxy`
              )
          );
          progress = true;
        }
      }
    }
    return progress;
  }
}

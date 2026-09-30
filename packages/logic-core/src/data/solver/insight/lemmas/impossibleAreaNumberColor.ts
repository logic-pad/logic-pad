import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import AreaNumberSymbol, {
  instance as areaNumberInstance,
} from '../../../symbols/areaNumberSymbol.js';
import { cell, modifyTiles } from '../helper.js';
import { Color } from '../../../primitives.js';

const COLORS = [Color.Dark, Color.Light] as const;

export default class ImpossibleAreaNumberColor extends InsightLemma {
  public readonly id = 'impossible-area-number-color';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id);
  }

  public apply(context: InsightContext): boolean {
    for (const symbol of context.grid.symbols.get(areaNumberInstance.id) ??
      []) {
      const position = {
        x: Math.floor(symbol.x),
        y: Math.floor(symbol.y),
      };
      const originTile = context.grid.getTile(position.x, position.y);
      if (!originTile.exists || originTile.color !== Color.Gray) continue;
      for (const color of COLORS) {
        const hypothetical = context.copy();
        hypothetical.setTiles(
          modifyTiles(hypothetical.grid, (x, y, { get, setColor }) => {
            const tile = get(x, y);
            if (
              tile.exists &&
              !tile.fixed &&
              tile.color === Color.Gray &&
              (x === Math.floor(symbol.x) || x === Math.ceil(symbol.x)) &&
              (y === Math.floor(symbol.y) || y === Math.ceil(symbol.y))
            ) {
              setColor(x, y, color);
            }
            return tile;
          })
        );

        const regionSizes = hypothetical.regionSizes;
        const proof = this.proof().difficulty(2);
        const region = hypothetical.regions.get(position);
        if (!region) continue;
        const fillOpposite = () => {
          return modifyTiles(
            context.grid,
            (x, y, { get, setOppositeColor }) => {
              const tile = get(x, y);
              if (
                tile.exists &&
                !tile.fixed &&
                tile.color === Color.Gray &&
                (x === Math.floor(symbol.x) || x === Math.ceil(symbol.x)) &&
                (y === Math.floor(symbol.y) || y === Math.ceil(symbol.y))
              ) {
                setOppositeColor(x, y, color);
              }
              return tile;
            }
          );
        };
        const regionMap = region.getRegionMap();
        hypothetical.regions.explainRegion(region, proof);
        const flatMap = regionMap.flat();
        const maxComplete = flatMap.reduce(
          (count, cell) => count + (cell || cell === null ? 1 : 0),
          0
        );
        const minComplete = flatMap.reduce(
          (count, cell) => count + (cell ? 1 : 0),
          0
        );
        const possibilities = regionSizes.getPossibilities(region, proof);
        if (possibilities && possibilities.length === 0) {
          const numbers = [
            ...new Set(
              [...region.symbols]
                .filter(
                  (symbol): symbol is AreaNumberSymbol =>
                    symbol instanceof AreaNumberSymbol
                )
                .map(symbol => symbol.number)
            ),
          ];
          context.setTiles(
            fillOpposite(),
            proof.describe(
              numbers.length > 1
                ? `Area number at ${cell(position)} cannot be ${color} because it would merge area numbers ${numbers.join(' and ')} into one region, which cannot all be satisfied`
                : `Area number at ${cell(position)} cannot be ${color} because that region has no possible size left`
            )
          );
          return true;
        }
        if (!possibilities) continue;
        const minPossible = regionSizes.minPossible(region, proof);
        if (minPossible > maxComplete) {
          context.setTiles(
            fillOpposite(),
            proof.describe(
              `Area number at ${cell(position)} cannot be ${color} because it must be completed with ${minPossible} cells but there are at most ${maxComplete} ${color} cells in the region`
            )
          );
          return true;
        }
        const maxPossible = regionSizes.maxPossible(region, proof);
        if (maxPossible < minComplete) {
          context.setTiles(
            fillOpposite(),
            proof.describe(
              `Area number at ${cell(position)} cannot be ${color} because it must be completed with ${maxPossible} cells but there are at least ${minComplete} ${color} cells in the region`
            )
          );
          return true;
        }
      }
    }
    return false;
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { cell, modifyTiles } from '../helper.js';
import { Color } from '../../../primitives.js';

const COLORS = [Color.Dark, Color.Light] as const;

export default class ImpossibleAreaNumberColor extends InsightLemma {
  public readonly id = 'impossible-area-number-color';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const numberSymbols = context.numberSymbols;
    let progress = false;
    for (const [idx, symbol] of context.grid.symbols
      .get(areaNumberInstance.id)
      ?.entries() ?? []) {
      const position = {
        x: Math.floor(symbol.x),
        y: Math.floor(symbol.y),
      };
      const originTile = context.grid.getTile(position.x, position.y);
      if (!originTile.exists || originTile.color !== Color.Gray) continue;
      const tag = numberSymbols.getTag(areaNumberInstance.id, idx);
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

        const proof = this.proof().difficulty(2);
        const regionMap = hypothetical.regions
          .get(position)
          ?.getRegionMap(proof);
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
        if (minPossible > maxComplete) {
          context.setTiles(
            fillOpposite(),
            proof.describe(
              `Area number at ${cell(position)} cannot be ${color} because it must be completed with ${minPossible} cells but there are at most ${maxComplete} ${color} cells in the region`
            )
          );
          progress = true;
          break;
        }
        const maxPossible = numberSymbols.maxPossible(tag, proof);
        if (maxPossible < minComplete) {
          context.setTiles(
            fillOpposite(),
            proof.describe(
              `Area number at ${cell(position)} cannot be ${color} because it must be completed with ${maxPossible} cells but there are at least ${minComplete} ${color} cells in the region`
            )
          );
          progress = true;
          break;
        }
      }
    }
    return progress;
  }
}

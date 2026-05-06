import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as galaxyInstance } from '../../../symbols/galaxySymbol.js';
import { area } from '../helper.js';
import { Region } from '../stores/regionStore.js';
import Proof from '../types/proof.js';
import { Color } from '../../../primitives.js';

export default class DisconnectIncompatibleSymmetries extends InsightLemma {
  public readonly id = 'disconnect-incompatible-symmetries';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === galaxyInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const regions = [...context.regions.regions.values()];
    let progress = false;
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const regionA = regions[i];
        const regionB = regions[j];
        if (regionA.color === Color.Gray && regionB.color === Color.Gray)
          continue;
        if (
          regionA.color !== Color.Gray &&
          regionB.color !== Color.Gray &&
          regionA.color !== regionB.color
        )
          continue;
        const proof = this.isIncompatible(regionA, regionB);
        if (proof) {
          const modified = context.regions.addDisconnected(
            regionA.positions[0],
            regionB.positions[0],
            proof
          );
          progress ||= modified;
        }
      }
    }
    return progress;
  }

  private isIncompatible(regionA: Region, regionB: Region): Proof | null {
    const galaxyA = [...regionA.symbols].find(s => s.id === galaxyInstance.id);
    const galaxyB = [...regionB.symbols].find(s => s.id === galaxyInstance.id);
    if (!galaxyA && !galaxyB) return null;
    if (!galaxyA && galaxyB) return this.isIncompatible(regionB, regionA);
    if (galaxyA && galaxyB) {
      return galaxyA === galaxyB
        ? null
        : this.proof()
            .difficulty(2)
            .describe(
              `${area(regionA.positions[0])} and ${area(regionB.positions[0])} must be separate because they have different galaxy symbols`
            );
    }
    if (galaxyA && !galaxyB) {
      const proof = this.proof().difficulty(3);
      const regionMapA = regionA.getRegionMap(proof);
      const regionMapB = regionB.getRegionMap(proof);
      for (let y = 0; y < regionMapB.length; y++) {
        for (let x = 0; x < regionMapB[y].length; x++) {
          if (regionMapB[y][x] !== true) continue;
          const oppositeX = galaxyA.x + (galaxyA.x - x);
          const oppositeY = galaxyA.y + (galaxyA.y - y);
          if (
            regionMapA[oppositeY]?.[oppositeX] === false ||
            regionMapA[oppositeY]?.[oppositeX] === undefined
          ) {
            return this.proof()
              .difficulty(2)
              .describe(
                `${area(regionA.positions[0])} and ${area(regionB.positions[0])} must be separate because their combined region is not symmetrical`
              );
          }
        }
      }
    }
    return null;
    // todo: also consider lotuses
  }
}

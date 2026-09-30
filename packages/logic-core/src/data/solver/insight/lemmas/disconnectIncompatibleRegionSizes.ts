import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { area } from '../helper.js';
import { Region } from '../stores/regionStore.js';
import { Color } from '../../../primitives.js';

/**
 * Disconnects regions whose possible sizes do not overlap: two regions cannot merge if they
 * cannot have the same region size.
 */
export default class DisconnectIncompatibleRegionSizes extends InsightLemma {
  public readonly id = 'disconnect-incompatible-region-sizes';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const regionSizes = context.regionSizes;
    const constrained: { region: Region; possibilities: number[] }[] = [];
    for (const region of context.regions.regions.values()) {
      const possibilities = regionSizes.getPossibilities(region);
      if (possibilities && possibilities.length > 0) {
        constrained.push({ region, possibilities });
      }
    }
    let progress = false;
    for (let i = 0; i < constrained.length; i++) {
      for (let j = i + 1; j < constrained.length; j++) {
        const { region: regionA, possibilities: possibilitiesA } =
          constrained[i];
        const { region: regionB, possibilities: possibilitiesB } =
          constrained[j];
        if (
          regionA.color !== Color.Gray &&
          regionB.color !== Color.Gray &&
          regionA.color !== regionB.color
        )
          continue;
        const sizesB = new Set(possibilitiesB);
        if (possibilitiesA.every(value => !sizesB.has(value))) {
          const proof = this.proof().difficulty(2);
          regionSizes.getPossibilities(regionA, proof);
          regionSizes.getPossibilities(regionB, proof);
          const modified = context.regions.addDisconnected(
            regionA.positions[0],
            regionB.positions[0],
            proof.describe(
              `${area(regionA.positions[0])} and ${area(regionB.positions[0])} must be separate because they must have different sizes`
            )
          );
          progress ||= modified;
        }
      }
      for (const regionB of context.regions.regions.values()) {
        const { region: regionA, possibilities: possibilitiesA } =
          constrained[i];
        if (regionA === regionB) continue;
        if (regionB.color !== regionA.color) continue;
        const countA = regionA
          .getRegionMap()
          .flat()
          .reduce((prev, curr) => prev + (curr ? 1 : 0), 0);
        const countB = regionB
          .getRegionMap()
          .flat()
          .reduce((prev, curr) => prev + (curr ? 1 : 0), 0);
        const maxA = possibilitiesA.reduce(
          (prev, curr) => Math.max(prev, curr),
          0
        );
        // Connecting two regions that are not touching yet costs at least one extra cell.
        const extra = this.areAdjacent(regionA, regionB) ? 0 : 1;
        if (countA + countB + extra > maxA) {
          const proof = this.proof().difficulty(2);
          regionSizes.getPossibilities(regionA, proof);
          const modified = context.regions.addDisconnected(
            regionA.positions[0],
            regionB.positions[0],
            proof.describe(
              `${area(regionA.positions[0])} and ${area(regionB.positions[0])} must be separate because they cannot satisfy region size constraints when combined`
            )
          );
          progress ||= modified;
        }
      }
    }
    return progress;
  }

  /** True when a cell of one region is orthogonally adjacent to a cell of the other. */
  private areAdjacent(regionA: Region, regionB: Region): boolean {
    const cellsB = new Set(regionB.positions.map(pos => `${pos.x},${pos.y}`));
    return regionA.positions.some(
      pos =>
        cellsB.has(`${pos.x + 1},${pos.y}`) ||
        cellsB.has(`${pos.x - 1},${pos.y}`) ||
        cellsB.has(`${pos.x},${pos.y + 1}`) ||
        cellsB.has(`${pos.x},${pos.y - 1}`)
    );
  }
}

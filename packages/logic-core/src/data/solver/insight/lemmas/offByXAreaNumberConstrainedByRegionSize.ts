import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as offByXInstance } from '../../../rules/offByXRule.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { cell } from '../helper.js';

export default class OffByXAreaNumberConstrainedByRegionSize extends InsightLemma {
  public readonly id = 'off-by-x-area-number-constrained-by-region-size';

  public isApplicable(grid: GridData): boolean {
    return (
      !!grid.findRule(rule => rule.id === offByXInstance.id) &&
      !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id)
    );
  }

  public apply(context: InsightContext): boolean {
    const regionSizes = context.regionSizes;
    const regions = context.regions;
    let progress = false;
    for (const symbol of context.grid.symbols.get(areaNumberInstance.id) ??
      []) {
      const position = {
        x: Math.floor(symbol.x),
        y: Math.floor(symbol.y),
      };
      const region = regions.get(position);
      if (!region) continue;
      const possibilities = regionSizes.getPossibilities(region);
      if (!possibilities || possibilities.length <= 1) continue;
      const regionMap = region.getRegionMap().flat();
      const maximum = regionMap.reduce(
        (count, cell) => count + (cell || cell === null ? 1 : 0),
        0
      );
      const minimum = regionMap.reduce(
        (count, cell) => count + (cell ? 1 : 0),
        0
      );
      for (const possibility of possibilities) {
        if (possibility > maximum || possibility < minimum) {
          const proof = this.proof().difficulty(1);
          region.getRegionMap(proof);
          const changed = regionSizes.eliminatePossibility(
            region,
            possibility,
            proof.describe(
              `Area number at ${cell(position)} cannot be ${possibility} because the region size is between ${minimum} and ${maximum}`
            )
          );
          progress ||= changed;
        }
      }
    }
    return progress;
  }
}

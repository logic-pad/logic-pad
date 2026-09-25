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
    const numberSymbols = context.numberSymbols;
    const regions = context.regions;
    let progress = false;
    for (const [idx, symbol] of context.grid.symbols
      .get(areaNumberInstance.id)
      ?.entries() ?? []) {
      const tag = numberSymbols.getTag(areaNumberInstance.id, idx);
      const possibilities = numberSymbols.getPossibilities(tag);
      if (possibilities.length <= 1) continue;
      const position = {
        x: Math.floor(symbol.x),
        y: Math.floor(symbol.y),
      };
      const proof = this.proof().difficulty(1);
      const regionMap = regions.get(position)?.getRegionMap(proof).flat();
      if (!regionMap) continue;
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
          const changed = numberSymbols.eliminatePossibility(
            tag,
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

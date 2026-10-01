import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import SymbolsPerRegionRule from '../../../rules/symbolsPerRegionRule.js';
import { area } from '../helper.js';
import { Color, Comparison } from '../../../primitives.js';
import { Region } from '../stores/regionStore.js';
import Symbol from '../../../symbols/symbol.js';

/**
 * Disconnects regions whose combined symbol count would violate a symbols per area rule.
 *
 * Only rules that bound the count from above (`exactly` and `at most`) can produce such a
 * contradiction, so `at least` rules are ignored. A region pair is considered when both could end
 * up in the rule's color, and at least one of them already has that color determined: two gray
 * regions may still merge into a region of the opposite color, which the rule does not constrain.
 *
 * Symbols are counted the same way the rule validates them: a symbol belongs to a region when it
 * touches one of the region's confirmed cells, and a symbol shared by both regions is only counted
 * once.
 */
export default class DisconnectIncompatibleSymbolCounts extends InsightLemma {
  public readonly id = 'disconnect-incompatible-symbol-counts';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(
      rule =>
        rule instanceof SymbolsPerRegionRule &&
        rule.comparison !== Comparison.AtLeast
    );
  }

  public apply(context: InsightContext): boolean {
    const rules = context.grid.rules.filter(
      (rule): rule is SymbolsPerRegionRule =>
        rule instanceof SymbolsPerRegionRule &&
        rule.comparison !== Comparison.AtLeast
    );
    let progress = false;
    for (const rule of rules) {
      if (rule.color === Color.Gray) continue;
      const candidates = [...context.regions.regions.values()].filter(
        region => region.color === rule.color || region.color === Color.Gray
      );
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const regionA = candidates[i];
          const regionB = candidates[j];
          if (regionA.color === Color.Gray && regionB.color === Color.Gray)
            continue;
          const symbols = this.mergedSymbols(regionA, regionB);
          if (symbols.length <= rule.count) continue;
          const proof = this.proof().difficulty(2);
          const modified = context.regions.addDisconnected(
            regionA.positions[0],
            regionB.positions[0],
            proof.describe(
              `${area(regionA.positions[0])} and ${area(regionB.positions[0])} must be separate because they hold ${symbols.length} symbols at ${symbols.map(symbol => `(${symbol.x},${symbol.y})`).join('; ')}, more than the ${rule.count} allowed per ${rule.color} area`
            )
          );
          progress ||= modified;
        }
      }
    }
    return progress;
  }

  /** The symbols that the merged region would contain, counted once each. */
  private mergedSymbols(regionA: Region, regionB: Region): Symbol[] {
    const symbols = new Map<Symbol, boolean>();
    for (const symbol of regionA.symbols) {
      if (symbol.necessaryForCompletion) symbols.set(symbol, true);
    }
    for (const symbol of regionB.symbols) {
      if (symbol.necessaryForCompletion) symbols.set(symbol, true);
    }
    return [...symbols.keys()];
  }
}

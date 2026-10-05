import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import SymbolsPerRegionRule from '../../../rules/symbolsPerRegionRule.js';
import { area, cell, symbolCorners } from '../helper.js';
import { Color, Comparison, Position } from '../../../primitives.js';
import Symbol from '../../../symbols/symbol.js';
import { RegionMap } from '../stores/regionStore.js';

const plural = (count: number) => (count === 1 ? '' : 's');

interface SymbolEntry {
  symbol: Symbol;
  /** Corners whose region-map cell is not provably outside the region. */
  corners: Position[];
  /** Whether some corner is already confirmed inside the region. */
  inside: boolean;
}

/**
 * Forces symbol membership when a region's reachable symbol count hits a symbols-per-area bound.
 *
 * - Lower bound (`exactly`/`at least`): if the region can reach exactly the required number of
 *   symbols, every reachable symbol must end up inside it, so they are connected to the region.
 * - Upper bound (`exactly`/`at most`): if the region already holds the allowed number of symbols,
 *   no further symbol may join, so the remaining reachable symbols are disconnected from it.
 *
 * Symbols are counted the way the rule validates them: a symbol touches the region when one of
 * its corner cells is in the region map, and is reachable when that cell is not provably outside.
 */
export default class SymbolCountBounds extends InsightLemma {
  public readonly id = 'symbol-count-bounds';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(rule => rule instanceof SymbolsPerRegionRule);
  }

  public apply(context: InsightContext): boolean {
    const rules = context.grid.rules.filter(
      (rule): rule is SymbolsPerRegionRule =>
        rule instanceof SymbolsPerRegionRule
    );
    if (rules.length === 0) return false;
    let progress = false;
    for (const region of context.regions.regions.values()) {
      const map = region.getRegionMap();
      const entries = this.classify(context, map);
      const insideCount = entries.filter(entry => entry.inside).length;
      for (const rule of rules) {
        if (rule.color !== Color.Gray && region.color !== rule.color) continue;
        const lowerBound = rule.comparison !== Comparison.AtMost;
        const upperBound = rule.comparison !== Comparison.AtLeast;

        if (lowerBound && entries.length === rule.count) {
          for (const entry of entries) {
            if (entry.inside) continue;
            const proof = this.proof()
              .difficulty(2)
              .describe(
                `Region at ${area(region.positions[0])} can reach exactly ${rule.count} symbol${plural(rule.count)} as required by the rule, so the symbol at ${cell(entry.symbol)} must be part of it`
              );
            for (const corner of entry.corners) {
              progress ||= context.regions.addConnected(
                corner,
                region.positions[0],
                proof
              );
            }
          }
        }

        if (upperBound && insideCount === rule.count) {
          for (const entry of entries) {
            if (entry.inside) continue;
            const proof = this.proof()
              .difficulty(2)
              .describe(
                `Region at ${area(region.positions[0])} already holds the ${rule.count} symbol${plural(rule.count)} the rule allows, so the symbol at ${cell(entry.symbol)} must stay outside it`
              );
            for (const corner of entry.corners) {
              progress ||= context.regions.addDisconnected(
                corner,
                region.positions[0],
                proof
              );
            }
          }
        }
      }
    }
    return progress;
  }

  private classify(context: InsightContext, map: RegionMap): SymbolEntry[] {
    const entries: SymbolEntry[] = [];
    for (const [_, list] of context.grid.symbols.entries()) {
      for (const symbol of list) {
        if (!symbol.necessaryForCompletion) continue;
        const corners: Position[] = [];
        let inside = false;
        for (const corner of symbolCorners(symbol)) {
          const value = map[corner.y]?.[corner.x];
          if (value === undefined) continue;
          if (value !== false) corners.push(corner);
          if (value === true) inside = true;
        }
        if (corners.length > 0) entries.push({ symbol, corners, inside });
      }
    }
    return entries;
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import SymbolsPerRegionRule from '../../../rules/symbolsPerRegionRule.js';
import {
  cell,
  modifyTiles,
  setOppositeColor,
  symbolCorners,
} from '../helper.js';
import {
  Color,
  Comparison,
  DIRECTIONS,
  Position,
} from '../../../primitives.js';
import { move } from '../../../dataHelper.js';
import Symbol from '../../../symbols/symbol.js';

const plural = (count: number) => (count === 1 ? '' : 's');

/**
 * Colors a gray cell against a color that would leave an area unable to meet a symbols-per-area
 * minimum. If filling the cell with color C (taking merged tiles as atomic) can reach, across the
 * whole C-or-gray area it would belong to, fewer `necessaryForCompletion` symbols than an
 * `exactly`/`at least` rule demands, then C is impossible there and the cell must be the opposite
 * color. When both colors are impossible the grid is in an invalid state.
 *
 * Reachable symbols are counted optimistically (every gray cell on the flood is assumed to take
 * color C), so a shortfall is a genuine contradiction rather than a missing later deduction.
 */
export default class ImpossibleSymbolAreaColor extends InsightLemma {
  public readonly id = 'impossible-symbol-area-color';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(
      rule =>
        rule instanceof SymbolsPerRegionRule &&
        rule.comparison !== Comparison.AtMost &&
        rule.color !== Color.Gray
    );
  }

  public apply(context: InsightContext): boolean {
    const grid = context.grid;
    const maxRequired: Record<Color, number> = {
      [Color.Dark]: 0,
      [Color.Light]: 0,
      [Color.Gray]: 0,
    };
    for (const rule of grid.rules) {
      if (!(rule instanceof SymbolsPerRegionRule)) continue;
      if (rule.comparison === Comparison.AtMost) continue;
      // A gray rule constrains the current undecided blob rather than the finished colored
      // areas, so it says nothing about which color a cell may take.
      if (rule.color === Color.Gray) continue;
      maxRequired[rule.color] = Math.max(maxRequired[rule.color], rule.count);
    }
    if (maxRequired[Color.Dark] === 0 && maxRequired[Color.Light] === 0)
      return false;

    const cellSymbols = new Map<string, Symbol[]>();
    for (const [_, list] of grid.symbols.entries()) {
      for (const symbol of list) {
        if (!symbol.necessaryForCompletion) continue;
        for (const corner of symbolCorners(symbol)) {
          const key = `${corner.x},${corner.y}`;
          const existing = cellSymbols.get(key);
          if (existing) existing.push(symbol);
          else cellSymbols.set(key, [symbol]);
        }
      }
    }

    const keyOf = (p: Position) => `${p.x},${p.y}`;
    const countReachable = (
      start: readonly Position[],
      color: Color,
      required: number
    ) => {
      const visited = new Set<string>();
      const seen = new Set<Symbol>();
      const queue: Position[] = [];
      const collect = (p: Position) => {
        for (const symbol of cellSymbols.get(keyOf(p)) ?? []) {
          seen.add(symbol);
        }
      };
      for (const p of start) {
        const key = keyOf(p);
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push(p);
        collect(p);
      }
      if (seen.size >= required) return seen.size;
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const direction of DIRECTIONS) {
          const next = move(current, direction);
          if (!grid.isPositionValid(next.x, next.y)) continue;
          const tile = grid.getTile(next.x, next.y);
          if (!tile.exists) continue;
          if (tile.color !== color && tile.color !== Color.Gray) continue;
          for (const merged of grid.connections.getConnectedTiles(next)) {
            const key = keyOf(merged);
            if (visited.has(key)) continue;
            visited.add(key);
            queue.push(merged);
            collect(merged);
          }
          if (seen.size >= required) return seen.size;
        }
      }
      return seen.size;
    };

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        const start = grid.connections.getConnectedTiles({ x, y });
        // The tile must be freely recolorable: a fixed member locks the whole tile, and a
        // non-gray member already determines its color (another lemma handles that case).
        if (
          start.some(p => {
            const t = grid.getTile(p.x, p.y);
            return t.fixed || t.color !== Color.Gray;
          })
        )
          continue;
        const forbidden: Color[] = [];
        for (const color of [Color.Dark, Color.Light] as const) {
          const required = maxRequired[color];
          if (required === 0) continue;
          if (countReachable(start, color, required) < required)
            forbidden.push(color);
        }
        if (forbidden.length === 0) continue;
        if (forbidden.length === 2) {
          throw this.error(
            `Cell at ${cell({ x, y })} cannot be ${forbidden[0]} or ${forbidden[1]} because either color would form an area with too few symbols`
          );
        }
        const color = forbidden[0];
        const newTiles = modifyTiles(grid);
        for (const p of start) {
          setOppositeColor(grid, newTiles, p.x, p.y, color);
        }
        context.setTiles(
          newTiles,
          this.proof()
            .difficulty(2)
            .describe(
              `Cell at ${cell({ x, y })} cannot be ${color} because the ${color} area there can reach fewer than the ${maxRequired[color]} symbol${plural(maxRequired[color])} the rule requires, so it must be ${color === Color.Dark ? Color.Light : Color.Dark}`
            )
        );
        return true;
      }
    }
    return false;
  }
}

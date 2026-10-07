import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import DartSymbol, {
  instance as dartInstance,
} from '../../../symbols/dartSymbol.js';
import {
  cell,
  modifyTiles,
  orList,
  setColor,
  setOppositeColor,
} from '../helper.js';
import { Color, Position, Wrapping } from '../../../primitives.js';
import { move } from '../../../dataHelper.js';

/** Selection counts are only tested against zero, so "one" vs "more" is enough. */
const CAP = 2;

const plural = (count: number) => (count === 1 ? '' : 's');

const list = (values: number[]) =>
  values.length === 1
    ? `${values[0]}`
    : `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`;

/** `table[i][sum]` is the number of ways to pick from `sizes[i..]` summing to `sum`. */
function suffixTable(sizes: number[], target: number): number[][] {
  const table: number[][] = Array.from({ length: sizes.length + 1 }, () =>
    new Array<number>(target + 1).fill(0)
  );
  table[sizes.length][0] = 1;
  for (let i = sizes.length - 1; i >= 0; i--) {
    for (let sum = 0; sum <= target; sum++) {
      let count = table[i + 1][sum];
      if (sum >= sizes[i]) count += table[i + 1][sum - sizes[i]];
      table[i][sum] = Math.min(CAP, count);
    }
  }
  return table;
}

/** `table[i][sum]` is the number of ways to pick from `sizes[..i - 1]` summing to `sum`. */
function prefixTable(sizes: number[], target: number): number[][] {
  const table: number[][] = Array.from({ length: sizes.length + 1 }, () =>
    new Array<number>(target + 1).fill(0)
  );
  table[0][0] = 1;
  for (let i = 0; i < sizes.length; i++) {
    for (let sum = 0; sum <= target; sum++) {
      let count = table[i][sum];
      if (sum >= sizes[i]) count += table[i][sum - sizes[i]];
      table[i + 1][sum] = Math.min(CAP, count);
    }
  }
  return table;
}

/**
 * How many selections of `sizes` add up to `target` and either include or exclude the group at
 * `index`.
 */
function selectionCount(
  prefix: number[][],
  suffix: number[][],
  sizes: number[],
  index: number,
  target: number,
  included: boolean
): number {
  let total = 0;
  for (let sum = 0; sum <= target; sum++) {
    if (prefix[index][sum] === 0) continue;
    const rest = target - sum - (included ? sizes[index] : 0);
    if (rest < 0) continue;
    total += prefix[index][sum] * suffix[index + 1][rest];
  }
  return total;
}

/** A value the dart could still hold, with the subset-sum tables for the cells it needs. */
interface Candidate {
  value: number;
  target: number;
  prefix: number[][];
  suffix: number[][];
}

/**
 * Completes darts by treating each merged tile that they see as a single unit that either
 * contributes all of its cells or none of them to the dart's count:
 *
 * 1. The dart still needs `value - opposite` opposite-colored cells, where `opposite` is the
 *    number of opposite-colored cells that it already sees.
 * 2. The gray cells that the dart sees are grouped by merged tile, so each group contributes
 *    either its full size or nothing to the remaining count.
 * 3. Every group is then classified by the combinations that add up to the remaining count: one
 *    that appears in no combination must share the dart's color, and one that appears in every
 *    combination must be opposite-colored. Groups that appear in some but not all combinations are
 *    left for a later step, once the other groups have narrowed the count down.
 *
 * Under an off-by-X rule a dart admits two values, so each candidate is tested separately: a
 * candidate with no satisfying combination is eliminated through the number symbol store, and a
 * group is only colored when the verdict agrees on **every** surviving candidate.
 *
 * Classifying by combination membership covers the direct cases as well: a group bigger than the
 * remaining count is in no combination, a group large enough that the rest cannot reach the count
 * without it is in every combination, and when the combinations collapse to a single one every
 * group is decided at once.
 *
 * Grids that wrap around are ignored because the cells seen by a dart cannot be enumerated
 * reliably there.
 */
export default class CompleteDart extends InsightLemma {
  public readonly id = 'complete-dart';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === dartInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const wrapAround = context.grid.wrapAround.value;
    if (
      wrapAround &&
      (wrapAround.horizontal !== Wrapping.None ||
        wrapAround.vertical !== Wrapping.None)
    )
      return false;

    for (const symbol of context.grid.symbols.get(dartInstance.id) ?? []) {
      if (this.applyToSymbol(context, symbol as DartSymbol)) return true;
    }
    return false;
  }

  private applyToSymbol(context: InsightContext, dart: DartSymbol): boolean {
    if (Math.floor(dart.x) !== dart.x || Math.floor(dart.y) !== dart.y)
      return false;
    const position = { x: dart.x, y: dart.y };
    const originTile = context.grid.getTile(position.x, position.y);
    if (!originTile.exists || originTile.color === Color.Gray) return false;
    const color = originTile.color;

    let opposite = 0;
    let unmodifiable = false;
    const grayCells: Position[] = [];
    let current = move(position, dart.orientation);
    while (context.grid.isPositionValid(current.x, current.y)) {
      const tile = context.grid.getTile(current.x, current.y);
      if (tile.exists) {
        if (tile.color === Color.Gray) {
          if (tile.fixed) unmodifiable = true;
          else grayCells.push({ ...current });
        } else if (tile.color !== color) {
          opposite++;
        }
      }
      current = move(current, dart.orientation);
    }
    if (unmodifiable) return false;

    const groups = this.groupByMergedTile(context.grid, grayCells);
    const sizes = groups.map(group => group.length);

    const values = context.numbers.getPossibilities(dart);
    if (!values) return false;
    if (values.length === 0)
      throw this.error(
        `Dart at ${cell(position)} has no possible value left for the number of cells it sees`
      );

    // Test each candidate value; keep the ones with a satisfying combination.
    const candidates: Candidate[] = [];
    const rejected = new Map<number, { short: string; legacy: string }>();
    for (const value of values) {
      const target = value - opposite;
      if (target < 0) {
        rejected.set(value, {
          short: `it already sees ${opposite} opposite-colored cell${plural(opposite)}`,
          legacy: `already sees ${opposite} opposite-colored cell${plural(opposite)}, which is more than its number ${value}`,
        });
        continue;
      }
      if (grayCells.length === 0) {
        if (target > 0) {
          rejected.set(value, {
            short: `it sees only ${opposite} opposite-colored cell${plural(opposite)} and no gray cells`,
            legacy: `sees only ${opposite} opposite-colored cell${plural(opposite)} and no gray cells, so it can never reach its number ${value}`,
          });
          continue;
        }
        candidates.push({
          value,
          target,
          prefix: prefixTable(sizes, target),
          suffix: suffixTable(sizes, target),
        });
        continue;
      }
      const available = sizes
        .filter(size => size <= target)
        .reduce((sum, size) => sum + size, 0);
      if (target > available) {
        rejected.set(value, {
          short: `its merged gray tiles can provide at most ${available} of the ${target} still needed`,
          legacy: `needs ${target} more opposite-colored cell${plural(target)} but its merged gray tiles, of sizes ${list(sizes)}, can only provide ${available}`,
        });
        continue;
      }
      const prefix = prefixTable(sizes, target);
      const suffix = suffixTable(sizes, target);
      if (suffix[0][target] === 0) {
        rejected.set(value, {
          short: `no combination of its merged gray tiles, of sizes ${list(sizes)}, adds up to ${target}`,
          legacy: `cannot see exactly ${value} opposite-colored cell${plural(value)} because no combination of its merged gray tiles, of sizes ${list(sizes)}, adds up to ${target}`,
        });
        continue;
      }
      candidates.push({ value, target, prefix, suffix });
    }

    if (candidates.length === 0) {
      if (values.length === 1)
        throw this.error(
          `Dart at ${cell(position)} ${rejected.get(values[0])!.legacy}`
        );
      throw this.error(
        `Dart at ${cell(position)} cannot see ${orList(values)} opposite-colored cells: ${[
          ...rejected.entries(),
        ]
          .map(([value, reason]) => `${value} because ${reason.short}`)
          .join('; ')}`
      );
    }

    // Some candidates were ruled out: record the eliminations and let the loop restart with the
    // surviving values before drawing any conclusions from them.
    if (candidates.length < values.length) {
      let progressed = false;
      for (const [value, reason] of rejected.entries()) {
        if (
          context.numbers.eliminatePossibility(
            dart,
            value,
            this.proof()
              .difficulty(2)
              .describe(
                `Dart at ${cell(position)} cannot see ${value} opposite-colored cell${plural(value)}: ${reason.short}`
              )
          )
        )
          progressed = true;
      }
      if (progressed) return true;
    }

    const oppositeColor = color === Color.Dark ? Color.Light : Color.Dark;
    const newTiles = modifyTiles(context.grid);
    const oppositeCells: Position[] = [];
    const sameCells: Position[] = [];
    let forced = 0;
    for (let i = 0; i < sizes.length; i++) {
      let inNone = true;
      let inAll = true;
      for (const candidate of candidates) {
        if (
          selectionCount(
            candidate.prefix,
            candidate.suffix,
            sizes,
            i,
            candidate.target,
            true
          ) !== 0
        )
          inNone = false;
        if (
          selectionCount(
            candidate.prefix,
            candidate.suffix,
            sizes,
            i,
            candidate.target,
            false
          ) !== 0
        )
          inAll = false;
      }
      if (!inNone && !inAll) continue;
      forced++;
      for (const pos of groups[i]) {
        if (inNone) {
          setColor(context.grid, newTiles, pos.x, pos.y, color);
          sameCells.push(pos);
        } else {
          setOppositeColor(context.grid, newTiles, pos.x, pos.y, color);
          oppositeCells.push(pos);
        }
      }
    }
    if (forced === 0) return false;

    const complete = forced === sizes.length;
    const targets = candidates.map(candidate => candidate.target);
    const surviving = candidates.map(candidate => candidate.value);
    const valueText =
      surviving.length === 1
        ? `${surviving[0]} opposite-colored cell${plural(surviving[0])}`
        : `${orList(surviving)} opposite-colored cells`;
    const targetText =
      targets.length === 1
        ? `${targets[0]} more opposite-colored cell${plural(targets[0])}`
        : `${orList(targets)} more opposite-colored cells`;
    const clauses: string[] = [];
    if (oppositeCells.length > 0)
      clauses.push(
        complete
          ? `cells at ${cell(oppositeCells)} must be ${oppositeColor}`
          : `the cells at ${cell(oppositeCells)} belong to all of them and must be ${oppositeColor}`
      );
    if (sameCells.length > 0)
      clauses.push(
        complete
          ? `cells at ${cell(sameCells)} must be ${color}`
          : `the cells at ${cell(sameCells)} belong to none of them and must be ${color}`
      );

    const prefixText =
      complete && sameCells.length === 0
        ? `Dart at ${cell(position)} needs all remaining cells to see ${valueText}, so `
        : complete && oppositeCells.length === 0
          ? `Dart at ${cell(position)} already sees ${valueText}, so `
          : complete
            ? `Dart at ${cell(position)} needs ${targetText} and only one combination of its merged gray tiles, of sizes ${list(sizes)}, adds up to ${orList(targets)}, so `
            : `Dart at ${cell(position)} needs ${targetText} and out of all possible combinations of gray tiles, `;

    context.setTiles(
      newTiles,
      this.proof()
        .difficulty(
          complete && (sameCells.length === 0 || oppositeCells.length === 0)
            ? 1
            : complete
              ? 3
              : 2
        )
        .describe(`${prefixText}${clauses.join(' and ')}`)
    );
    return true;
  }

  private groupByMergedTile(
    grid: GridData,
    grayCells: readonly Position[]
  ): Position[][] {
    const seen = new Set(grayCells.map(pos => `${pos.x},${pos.y}`));
    const grouped = new Set<string>();
    const groups: Position[][] = [];
    for (const pos of grayCells) {
      if (grouped.has(`${pos.x},${pos.y}`)) continue;
      const group: Position[] = [];
      for (const connected of grid.connections.getConnectedTiles(pos)) {
        const key = `${connected.x},${connected.y}`;
        if (!seen.has(key) || grouped.has(key)) continue;
        grouped.add(key);
        group.push({ x: connected.x, y: connected.y });
      }
      groups.push(group);
    }
    return groups;
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import DartSymbol, {
  instance as dartInstance,
} from '../../../symbols/dartSymbol.js';
import { cell, modifyTiles, setColor, setOppositeColor } from '../helper.js';
import { Color, Position, Wrapping } from '../../../primitives.js';
import { move } from '../../../dataHelper.js';

/** Number of selections that are tracked for each sum: 0, 1, or "more than one". */
const CAP = 2;

const plural = (count: number) => (count === 1 ? '' : 's');

/**
 * `table[i][sum]` is the number of ways to pick from `sizes[i..]` so that the picked sizes add
 * up to `sum`, capped at {@link CAP}.
 */
function selectionTable(sizes: number[], target: number): number[][] {
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

/** Recovers the only selection of `sizes` that adds up to `target`, assuming there is one. */
function pickSelection(
  table: number[][],
  sizes: number[],
  target: number
): number[] {
  const selection: number[] = [];
  let sum = target;
  for (let i = 0; i < sizes.length; i++) {
    const withItem = sum >= sizes[i] ? table[i + 1][sum - sizes[i]] : 0;
    const withoutItem = table[i + 1][sum];
    if (withItem === 1 && withoutItem === 0) {
      selection.push(i);
      sum -= sizes[i];
    }
  }
  return selection;
}

/**
 * Completes darts by treating each merged tile that they see as a single unit that either
 * contributes all of its cells or none of them to the dart's count:
 *
 * 1. The dart still needs `number - opposite` opposite-colored cells, where `opposite` is the
 *    number of opposite-colored cells that it already sees.
 * 2. The gray cells that the dart sees are grouped by merged tile, so each group contributes
 *    either its full size or nothing to the remaining count.
 * 3. If exactly one selection of groups adds up to the remaining count, the cells of those
 *    groups must be opposite-colored, and every other gray cell seen must share the dart's
 *    color.
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
      if (
        Math.floor(symbol.x) !== symbol.x ||
        Math.floor(symbol.y) !== symbol.y
      )
        continue;
      const position = { x: symbol.x, y: symbol.y };
      const originTile = context.grid.getTile(position.x, position.y);
      if (!originTile.exists || originTile.color === Color.Gray) continue;
      const color = originTile.color;
      const dart = symbol as DartSymbol;

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
      if (unmodifiable) continue;

      const target = dart.number - opposite;
      if (target < 0)
        throw this.error(
          `Dart at ${cell(position)} already sees ${opposite} opposite-colored cell${plural(opposite)}, which is more than its number ${dart.number}`
        );
      if (grayCells.length === 0) {
        if (target > 0)
          throw this.error(
            `Dart at ${cell(position)} sees only ${opposite} opposite-colored cell${plural(opposite)} and no gray cells, so it can never reach its number ${dart.number}`
          );
        continue;
      }

      const groups = this.groupByMergedTile(context.grid, grayCells);
      const sizes = groups.map(group => group.length);
      const available = sizes.reduce((sum, size) => sum + size, 0);
      if (target > available)
        throw this.error(
          `Dart at ${cell(position)} needs ${target} more opposite-colored cell${plural(target)} but only sees ${available} gray cell${plural(available)}`
        );

      const table = selectionTable(sizes, target);
      if (table[0][target] === 0)
        throw this.error(
          `Dart at ${cell(position)} cannot see exactly ${dart.number} opposite-colored cell${plural(dart.number)} because no combination of its merged gray cells [${sizes.join(',')}] adds up to ${target}`
        );
      if (table[0][target] > 1) continue;

      const selection = new Set(pickSelection(table, sizes, target));
      const oppositeColor = color === Color.Dark ? Color.Light : Color.Dark;
      const newTiles = modifyTiles(context.grid);
      const oppositeCells: Position[] = [];
      const sameCells: Position[] = [];
      for (let i = 0; i < groups.length; i++) {
        for (const pos of groups[i]) {
          if (selection.has(i)) {
            setOppositeColor(context.grid, newTiles, pos.x, pos.y, color);
            oppositeCells.push(pos);
          } else {
            setColor(context.grid, newTiles, pos.x, pos.y, color);
            sameCells.push(pos);
          }
        }
      }

      const description =
        oppositeCells.length === 0
          ? `Dart at ${cell(position)} already sees ${dart.number} opposite-colored cell${plural(dart.number)}, so cells at ${cell(sameCells)} must be ${color}`
          : sameCells.length === 0
            ? `Dart at ${cell(position)} needs all remaining cells to see ${dart.number} opposite-colored cell${plural(dart.number)}, so cells at ${cell(oppositeCells)} must be ${oppositeColor}`
            : `Dart at ${cell(position)} needs ${target} more opposite-colored cell${plural(target)} and [${sizes.join(',')}] has only one combination that adds up to ${target}, so cells at ${cell(oppositeCells)} must be ${oppositeColor} and cells at ${cell(sameCells)} must be ${color}`;

      context.setTiles(
        newTiles,
        this.proof()
          .difficulty(
            oppositeCells.length === 0 || sameCells.length === 0 ? 1 : 3
          )
          .describe(description)
      );
      return true;
    }
    return false;
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

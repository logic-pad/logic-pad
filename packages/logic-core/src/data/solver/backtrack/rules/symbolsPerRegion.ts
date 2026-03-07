import { array } from '../../../dataHelper.js';
import { Comparison, Position } from '../../../primitives.js';
import SymbolsPerRegionRule from '../../../rules/symbolsPerRegionRule.js';
import Symbol from '../../../symbols/symbol.js';
import BTModule, {
  BTGridData,
  BTTile,
  CheckResult,
  IntArray2D,
  colorToBTTile,
} from '../data.js';

export default class SymbolsPerRegionBTModule extends BTModule {
  public instr: SymbolsPerRegionRule;

  private symbolMap: Symbol[][][] = [];

  public constructor(
    instr: SymbolsPerRegionRule,
    width: number,
    height: number,
    allSymbols: Symbol[]
  ) {
    super();
    this.instr = instr;

    this.symbolMap = array(width, height, () => []);
    for (const symbol of allSymbols) {
      if (Math.floor(symbol.x) >= 0 && Math.floor(symbol.y) >= 0) {
        this.symbolMap[Math.floor(symbol.y)][Math.floor(symbol.x)].push(symbol);
      }
      if (
        Math.ceil(symbol.x) !== Math.floor(symbol.x) &&
        Math.ceil(symbol.x) < width &&
        Math.floor(symbol.y) >= 0
      ) {
        this.symbolMap[Math.floor(symbol.y)][Math.ceil(symbol.x)].push(symbol);
      }
      if (
        Math.ceil(symbol.y) !== Math.floor(symbol.y) &&
        Math.floor(symbol.x) >= 0 &&
        Math.ceil(symbol.y) < height
      ) {
        this.symbolMap[Math.ceil(symbol.y)][Math.floor(symbol.x)].push(symbol);
      }
      if (
        Math.ceil(symbol.x) !== Math.floor(symbol.x) &&
        Math.ceil(symbol.y) !== Math.floor(symbol.y) &&
        Math.ceil(symbol.x) < width &&
        Math.ceil(symbol.y) < height
      ) {
        this.symbolMap[Math.ceil(symbol.y)][Math.ceil(symbol.x)].push(symbol);
      }
    }
  }

  public checkGlobal(grid: BTGridData): CheckResult | false {
    const color = colorToBTTile(this.instr.color);

    const visited: IntArray2D = IntArray2D.create(grid.width, grid.height);

    let id = 0;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (visited.get(x, y) & 0b01111111) continue;
        if (grid.getTile(x, y) !== color) continue;

        id += 1;
        if (id > 127) throw new Error('Too many regions!');

        if (!this.visitArea(grid, color, visited, { x, y }, id)) return false;
      }
    }

    return { tilesNeedCheck: null, ratings: null };
  }

  private visitArea(
    grid: BTGridData,
    tile: BTTile,
    visited: IntArray2D,
    pos: Position,
    id: number
  ) {
    const sameTileQueue: Position[] = [pos];
    const usableTileQueue: Position[] = [];

    const completed = new Set<Symbol>();
    const possible = new Set<Symbol>();

    visited.set(pos.x, pos.y, id);

    // Count same tile
    while (sameTileQueue.length > 0) {
      const curPos = sameTileQueue.pop()!;

      this.symbolMap[curPos.y][curPos.x].forEach(symbol =>
        completed.add(symbol)
      );

      for (const edge of grid.getEdges(curPos)) {
        if ((visited.get(edge.x, edge.y) & 0b01111111) === id) continue;

        const edgeTile = grid.getTile(edge.x, edge.y);

        if (edgeTile === BTTile.Empty) {
          usableTileQueue.push(edge);
          visited.set(edge.x, edge.y, id | 0b10000000);
        } else if (edgeTile === tile) {
          sameTileQueue.push(edge);
          visited.set(edge.x, edge.y, id);
        }
      }
    }

    if (completed.size > this.instr.count) {
      return this.instr.comparison === Comparison.AtLeast;
    }

    if (this.instr.comparison === Comparison.AtMost) return true;

    // Count usable tile
    while (usableTileQueue.length > 0) {
      const curPos = usableTileQueue.pop()!;

      this.symbolMap[curPos.y][curPos.x].forEach(symbol => {
        if (!completed.has(symbol)) possible.add(symbol);
      });

      if (completed.size + possible.size >= this.instr.count) return true;

      for (const edge of grid.getEdges(curPos)) {
        if ((visited.get(edge.x, edge.y) & 0b01111111) === id) continue;

        const edgeTile = grid.getTile(edge.x, edge.y);

        if (edgeTile === BTTile.Empty || edgeTile === tile) {
          usableTileQueue.push(edge);
          visited.set(edge.x, edge.y, id | 0b10000000);
        }
      }
    }

    return completed.size + possible.size >= this.instr.count;
  }
}

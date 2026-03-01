import { Position } from '../../../primitives.js';
import LetterSymbol from '../../../symbols/letterSymbol.js';
import BTModule, {
  BTGridData,
  BTTile,
  CheckResult,
  checkSubtilePlacement,
  IntArray2D,
} from '../data.js';

export default class LetterBTModule extends BTModule {
  private letters: LetterSymbol[][];
  private letterGrid: IntArray2D;

  public constructor(instrs: LetterSymbol[], width: number, height: number) {
    super();
    this.letters = [];
    this.letterGrid = IntArray2D.create(width, height);

    const letterMap = new Map<string, number>();
    let letterCount = 0;

    for (const instr of instrs) {
      if (!letterMap.has(instr.letter)) {
        letterMap.set(instr.letter, letterCount);
        this.letters[letterCount] = [];
        letterCount += 1;
      }

      const id = letterMap.get(instr.letter)!;

      this.letters[id].push(instr);
      this.letterGrid.set(Math.floor(instr.x), Math.floor(instr.y), id + 1);
    }
  }

  public checkGlobal(grid: BTGridData): CheckResult | false {
    const visited = IntArray2D.create(grid.width, grid.height);

    for (let id = 0; id < this.letters.length; id++) {
      for (const symbol of this.letters[id]) {
        const checkResult = checkSubtilePlacement(grid, symbol);
        if (checkResult !== undefined) return checkResult;
      }
      for (const symbol of this.letters[id]) {
        const symbolX = Math.floor(symbol.x);
        const symbolY = Math.floor(symbol.y);

        if (grid.getTile(symbolX, symbolY) === BTTile.Empty) continue;

        if (!this.visitArea(grid, visited, { x: symbolX, y: symbolY }, id + 1))
          return false;

        break;
      }
    }

    return { tilesNeedCheck: null, ratings: null };
  }

  private visitArea(
    grid: BTGridData,
    visited: IntArray2D,
    pos: Position,
    id: number
  ) {
    const tile = grid.getTile(pos.x, pos.y);

    const sameTileQueue: Position[] = [pos];
    const usableTileQueue: Position[] = [];

    let letterVisited = 0;

    visited.set(pos.x, pos.y, id);

    // Count same tile
    while (sameTileQueue.length > 0) {
      const curPos = sameTileQueue.pop()!;

      const letterId = this.letterGrid.get(curPos.x, curPos.y);
      if (letterId === id) {
        letterVisited += 1;
      } else if (letterId !== 0) {
        return false;
      }

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

    if (letterVisited === this.letters[id - 1].length) return true;

    // Count usable tile
    while (usableTileQueue.length > 0) {
      const curPos = usableTileQueue.pop()!;

      const letterId = this.letterGrid.get(curPos.x, curPos.y);
      if (letterId === id) {
        letterVisited += 1;
        if (letterVisited === this.letters[id - 1].length) return true;
      }

      for (const edge of grid.getEdges(curPos)) {
        if ((visited.get(edge.x, edge.y) & 0b01111111) === id) continue;

        const edgeTile = grid.getTile(edge.x, edge.y);

        if (edgeTile === BTTile.Empty || edgeTile === tile) {
          usableTileQueue.push(edge);
          visited.set(edge.x, edge.y, id | 0b10000000);
        }
      }
    }

    return letterVisited === this.letters[id - 1].length;
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import DartSymbol, {
  instance as dartInstance,
} from '../../../symbols/dartSymbol.js';
import { cell, modifyTiles, setColor, setOppositeColor } from '../helper.js';
import { Color, Position } from '../../../primitives.js';
import { move } from '../../../dataHelper.js';

/**
 * Completes darts by directly counting the cells seen in their direction:
 *
 * 1. If the number of opposite-colored cells seen by a dart matches its number, every other cell
 *    in that direction must share the dart's color, so all gray cells there are filled with it.
 * 2. If the number of opposite-colored plus gray cells seen by a dart matches its number, every
 *    gray cell must count, so all gray cells there are filled with the opposite color.
 */
export default class CompleteDart extends InsightLemma {
  public readonly id = 'complete-dart';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === dartInstance.id);
  }

  public apply(context: InsightContext): boolean {
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
      const grayCells: Position[] = [];
      let current = move(position, dart.orientation);
      while (context.grid.isPositionValid(current.x, current.y)) {
        const tile = context.grid.getTile(current.x, current.y);
        if (tile.exists) {
          if (tile.color === Color.Gray) grayCells.push({ ...current });
          else if (tile.color !== color) opposite++;
        }
        current = move(current, dart.orientation);
      }
      if (grayCells.length === 0) continue;
      if (opposite === dart.number) {
        const newTiles = modifyTiles(context.grid);
        for (const pos of grayCells) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
          setColor(context.grid, newTiles, pos.x, pos.y, color);
        }
        context.setTiles(
          newTiles,
          this.proof()
            .difficulty(1)
            .describe(
              `Dart at ${cell(position)} already sees ${dart.number} opposite-colored cells, so cells at ${cell(grayCells)} must be ${color}`
            )
        );
        return true;
      } else if (opposite + grayCells.length === dart.number) {
        const oppositeColor = color === Color.Dark ? Color.Light : Color.Dark;
        const newTiles = modifyTiles(context.grid);
        for (const pos of grayCells) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
          setOppositeColor(context.grid, newTiles, pos.x, pos.y, color);
        }
        context.setTiles(
          newTiles,
          this.proof()
            .difficulty(1)
            .describe(
              `Dart at ${cell(position)} needs all remaining cells to see ${dart.number} opposite-colored cells, so cells at ${cell(grayCells)} must be ${oppositeColor}`
            )
        );
        return true;
      }
    }
    return false;
  }
}

import GridData from '../../../grid.js';
import InsightLemma from './insightLemma.js';
import BanPatternRule, {
  instance as banPatternInstance,
} from '../../../rules/banPatternRule.js';
import InsightContext from '../insightContext.js';
import { Color } from '../../../primitives.js';
import { cell, modifyTiles, setOppositeColor } from '../helper.js';

export default class BreakBannedPattern extends InsightLemma {
  public readonly id = 'break-banned-pattern';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(rule => rule.id === banPatternInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const rules = context.grid.rules.filter(
      (rule): rule is BanPatternRule => rule.id === banPatternInstance.id
    );

    for (const rule of rules) {
      for (const shape of rule.cache) {
        for (let dy = 0; dy <= context.grid.height - shape.height; dy++) {
          for (let dx = 0; dx <= context.grid.width - shape.width; dx++) {
            let mismatch: { x: number; y: number; color: Color } | null = null;
            let mismatchTile: string | null = null;
            for (const tile of shape.elements) {
              const x = dx + tile.x;
              const y = dy + tile.y;
              const t = context.grid.getTile(x, y);
              if (
                !t.exists ||
                ((t.fixed || t.color !== Color.Gray) && t.color !== tile.color)
              ) {
                mismatch = null;
                break;
              }
              if (t.color === tile.color) {
                continue;
              }
              // The cell is gray and disagrees with the pattern: the pattern can only
              // be broken by flipping its entire merged tile.
              const key = this.tileKey(context.grid, x, y);
              if (!mismatch) {
                mismatch = { x, y, color: tile.color };
                mismatchTile = key;
              } else if (
                mismatchTile !== key ||
                mismatch.color !== tile.color
              ) {
                mismatch = null;
                break;
              }
            }
            if (mismatch) {
              const newTiles = modifyTiles(context.grid);
              setOppositeColor(
                context.grid,
                newTiles,
                mismatch.x,
                mismatch.y,
                mismatch.color
              );
              const modified = context.grid.connections
                .getConnectedTiles({ x: mismatch.x, y: mismatch.y })
                .filter(pos => {
                  const t = context.grid.getTile(pos.x, pos.y);
                  return t.exists && !t.fixed && t.color === Color.Gray;
                });
              context.setTiles(
                newTiles,
                this.proof()
                  .difficulty(2)
                  .describe(
                    `Banned pattern must be broken at ${cell(modified)}`
                  )
              );
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /** Canonical key of the merged tile containing the given cell. */
  private tileKey(grid: GridData, x: number, y: number): string {
    const connected = grid.connections.getConnectedTiles({ x, y });
    let best = connected[0];
    for (const pos of connected) {
      if (pos.y < best.y || (pos.y === best.y && pos.x < best.x)) best = pos;
    }
    return `${best.x},${best.y}`;
  }
}

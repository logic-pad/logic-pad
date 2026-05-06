import GridData from '../../../grid.js';
import InsightLemma from './insightLemma.js';
import BanPatternRule, {
  instance as banPatternInstance,
} from '../../../rules/banPatternRule.js';
import InsightContext from '../insightContext.js';
import { ShapeElement } from '../../../shapes.js';
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
    let progress = false;

    for (const rule of rules) {
      for (const shape of rule.cache) {
        for (let dy = 0; dy <= context.grid.height - shape.height; dy++) {
          for (let dx = 0; dx <= context.grid.width - shape.width; dx++) {
            let mismatch: ShapeElement | null = null;
            for (const tile of shape.elements) {
              const t = context.grid.getTile(dx + tile.x, dy + tile.y);
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
              if (
                !t.fixed &&
                t.color === Color.Gray &&
                t.color !== tile.color
              ) {
                if (mismatch) {
                  mismatch = null;
                  break;
                } else {
                  mismatch = tile;
                }
              }
            }
            if (mismatch) {
              const newTiles = modifyTiles(context.grid);
              setOppositeColor(
                context.grid,
                newTiles,
                mismatch.x + dx,
                mismatch.y + dy,
                mismatch.color
              );
              context.setTiles(
                newTiles,
                this.proof()
                  .difficulty(2)
                  .describe(
                    `Banned pattern must be broken at ${cell({ x: mismatch.x + dx, y: mismatch.y + dy })}`
                  )
              );
              progress = true;
            }
          }
        }
      }
    }
    return progress;
  }
}

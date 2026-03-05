import GridData from '../../../grid.js';
import InsightLemma from './insightLemma.js';
import ConnectAllRule, {
  instance as connectAllInstance,
} from '../../../rules/connectAllRule.js';
import InsightContext from '../insightContext.js';
import { cell, modifyTiles } from '../helper.js';
import { Color } from '../../../primitives.js';

export default class ConnectAllRemovesDisconnectedRegions extends InsightLemma {
  public readonly id = 'connect-all-removes-disconnected-regions';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(rule => rule.id === connectAllInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const rules = context.grid.rules.filter(
      (rule): rule is ConnectAllRule => rule.id === connectAllInstance.id
    );
    const progress = false;
    for (const rule of rules) {
      const color = rule.color;
      const seed = context.grid.find(t => t.color === color);
      if (!seed) continue;
      const proof = this.proof().difficulty(1);
      const disconnected = context.regionStore
        .getDisconnectedRegions(seed, proof)
        .filter(region => {
          const t = context.grid.getTile(region.x, region.y);
          return t.exists && !t.fixed && t.color === Color.Gray;
        });
      if (disconnected.length === 0) continue;
      const newTiles = modifyTiles(
        context.grid,
        (x, y, { setOppositeColor }) => {
          if (disconnected.some(region => region.x === x && region.y === y)) {
            setOppositeColor(x, y, color);
          }
        }
      );
      context.setTiles(
        newTiles,
        proof.describe(
          `Cells at ${cell(disconnected)} cannot be ${color} because they are disconnected from the rest of the ${color} cells`
        )
      );
    }
    return progress;
  }
}

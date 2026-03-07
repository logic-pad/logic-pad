import GridData from '../../../grid.js';
import InsightLemma from './insightLemma.js';
import ConnectAllRule, {
  instance as connectAllInstance,
} from '../../../rules/connectAllRule.js';
import InsightContext from '../insightContext.js';
import { cell, modifyTiles, setOppositeColor } from '../helper.js';
import { Color, Position } from '../../../primitives.js';
import { Region } from '../stores/regionStore.js';

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
      const disconnected = context.regions.getDisconnectedRegions(seed, proof);
      if (disconnected.size === 0) continue;
      const disconnectedRegions: Region[] = [];
      for (const regionId of disconnected) {
        const region = context.regions.get(regionId);
        if (!region) continue;
        if (region.color === color) {
          throw this.error(
            `Region at ${cell(region.positions[0])} is disconnected from the rest of the ${color} cells, which violates the connect all rule`
          );
        }
        disconnectedRegions.push(region);
      }
      for (const region of disconnectedRegions) {
        const newTiles = modifyTiles(context.grid);
        const modified: Position[] = [];
        for (const pos of region.positions) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (tile.exists && !tile.fixed && tile.color === Color.Gray) {
            modified.push(pos);
            setOppositeColor(context.grid, newTiles, pos.x, pos.y, color);
          }
        }
        if (modified.length === 0) continue;
        context.setTiles(
          newTiles,
          proof.describe(
            `Cells at ${cell(modified)} cannot be ${color} because they are disconnected from the rest of the ${color} cells`
          )
        );
      }
    }
    return progress;
  }
}

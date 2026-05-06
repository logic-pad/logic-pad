import GridData from '../../../grid.js';
import InsightLemma from './insightLemma.js';
import ConnectAllRule, {
  instance as connectAllInstance,
} from '../../../rules/connectAllRule.js';
import InsightContext from '../insightContext.js';

export default class ConnectAllCells extends InsightLemma {
  public readonly id = 'connect-all-cells';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(rule => rule.id === connectAllInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const rules = context.grid.rules.filter(
      (rule): rule is ConnectAllRule => rule.id === connectAllInstance.id
    );
    let progress = false;
    for (const rule of rules) {
      const color = rule.color;
      const regions = context.regions.getByColor(color);
      if (regions.length < 2) continue;
      const proof = this.proof()
        .difficulty(2)
        .describe(`Connect all ${color} cells`);
      for (const [i, region] of regions.entries()) {
        for (let j = i + 1; j < regions.length; j++) {
          const otherRegion = regions[j];
          const changed = context.regions.addConnected(
            region.positions[0],
            otherRegion.positions[0],
            proof
          );
          progress ||= changed;
        }
      }
    }
    return progress;
  }
}

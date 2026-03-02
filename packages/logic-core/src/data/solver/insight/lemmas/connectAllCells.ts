import GridData from '../../../grid.js';
import InsightLemma from './insightLemma.js';
import ConnectAllRule, {
  instance as connectAllInstance,
} from '../../../rules/connectAllRule.js';
import InsightContext from '../insightContext.js';
import { array } from '../../../dataHelper.js';
import { Position } from '../../../primitives.js';
import { region } from '../helper.js';

export default class ConnectAllCells extends InsightLemma {
  public readonly id = 'connect-all-cells';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findRule(rule => rule.id === connectAllInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const grid = context.grid;
    const rules = grid.rules.filter(rule => rule.id === connectAllInstance.id);
    let progress = false;
    const visited = array(
      grid.width,
      grid.height,
      (i, j) => !grid.getTile(i, j).exists
    );
    for (const rule of rules) {
      const color = (rule as ConnectAllRule).color;
      const islands: Position[][] = [];
      while (true) {
        const seed = grid.find(
          (tile, x, y) => !visited[y][x] && tile.color === color
        );
        if (!seed) break;
        const positions: Position[] = [];
        grid.iterateArea(
          seed,
          tile => tile.color === color,
          (_, x, y) => {
            positions.push({ x, y });
          },
          visited
        );
        islands.push(positions);
      }
      if (islands.length <= 1) continue;
      for (let i = 1; i < islands.length; i++) {
        const proof = this.proof()
          .difficulty(2)
          .describe(`Connect all ${color} cells at ${region(islands[i][0])}`);
        progress ||= context.regionStore.addConnected(
          islands[0][0],
          islands[i][0],
          proof
        );
      }
    }
    return progress;
  }
}

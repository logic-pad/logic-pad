import GridData from '../../../grid.js';
import { Color, Position } from '../../../primitives.js';
import { cell, modifyTiles, area, setOneColor } from '../helper.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';

export default class ConnectThroughBottleneck extends InsightLemma {
  public readonly id = 'connect-through-bottleneck';

  public isApplicable(_grid: GridData): boolean {
    return true;
  }

  public apply(context: InsightContext): boolean {
    const regions = context.regions;
    let progress = false;
    for (const regionInfo of regions.regions.values()) {
      if (regionInfo.color === Color.Gray) continue;
      if (regionInfo.connectedAreas.size <= 1) continue;

      const proof = this.proof().difficulty(3);
      const graph = regionInfo.getRegionGraph(proof);
      const areas = [...regionInfo.connectedAreas];
      const area1 = regions.toPosition(areas[0]);
      const node1 = graph.getId(area1.x, area1.y);
      for (let i = 1; i < areas.length; i++) {
        const area2 = regions.toPosition(areas[i]);
        const node2 = graph.getId(area2.x, area2.y);
        const path = graph.shortestPath(node1, node2);
        const chokepoints: Position[] = [];
        for (const id of path) {
          if (graph.articulationPoints.has(id)) {
            chokepoints.push(...graph.getPositions(id));
          }
        }
        if (chokepoints.length === 0) continue;
        const modified: Position[] = [];
        const newTiles = modifyTiles(context.grid);
        for (const pos of chokepoints) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (tile.exists && !tile.fixed && tile.color === Color.Gray) {
            setOneColor(newTiles, pos.x, pos.y, regionInfo.color);
            modified.push(pos);
          }
        }
        if (modified.length === 0) continue;
        context.setTiles(
          newTiles,
          proof
            .copy()
            .describe(
              `Cells at ${cell(modified)} are bottlenecks connecting ${area([area1, area2])}, so they must be filled in`
            )
        );
        progress = true;
      }
    }
    return progress;
  }
}

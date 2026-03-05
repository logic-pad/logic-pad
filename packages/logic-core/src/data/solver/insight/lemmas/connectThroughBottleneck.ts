import { array } from '../../../dataHelper.js';
import GridData from '../../../grid.js';
import { Color, Position } from '../../../primitives.js';
import { cell, modifyTiles, region } from '../helper.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';

export default class ConnectThroughBottleneck extends InsightLemma {
  public readonly id = 'connect-through-bottleneck';

  public isApplicable(_grid: GridData): boolean {
    return true;
  }

  public apply(context: InsightContext): boolean {
    const regionStore = context.regionStore;
    let progress = false;
    const visited = array(context.grid.width, context.grid.height, () => false);
    while (true) {
      const seed = context.grid.find(
        (t, x, y) => !visited[y][x] && t.exists && t.color !== Color.Gray
      );
      if (!seed) break;

      // Find a region with disconnected areas
      const proof = this.proof().difficulty(3);
      const regionMap = regionStore.getRegionMap(seed, proof);
      const color = context.grid.getTile(seed.x, seed.y).color;
      regionMap.cells.forEach((row, y) =>
        row.forEach((cell, x) => {
          if (cell !== false) visited[y][x] = true;
        })
      );
      if (regionMap.islands.length <= 1) continue;

      // Compute shortest paths between the islands and compare them to the articulation points in the graph.
      // Haven't proven this rigorously, but I think chokepoints between two islands correspond to the intersection
      // of the shortest paths between the islands and the articulation points in the graph.
      const graph = regionStore.getGraph(seed, proof);
      const island1 = regionMap.islands[0];
      for (let i = 1; i < regionMap.islands.length; i++) {
        const island2 = regionMap.islands[i];
        const path = graph.shortestPath(
          graph.getId(island1.x, island1.y),
          graph.getId(island2.x, island2.y)
        );
        const chokepoints: Position[] = [];
        for (const id of path) {
          if (graph.articulationPoints.has(id)) {
            chokepoints.push(...graph.getPositions(id));
          }
        }
        if (chokepoints.length === 0) continue;
        const modified: Position[] = [];
        const newTiles = modifyTiles(
          context.grid,
          (x, y, { get, setOneColor }) => {
            const tile = get(x, y);
            if (tile.exists && !tile.fixed && tile.color === Color.Gray) {
              const position = chokepoints.find(p => p.x === x && p.y === y);
              if (position) {
                setOneColor(x, y, color);
                modified.push(position);
              }
            }
          }
        );
        if (modified.length === 0) continue;
        context.setTiles(
          newTiles,
          proof
            .copy()
            .describe(
              `Cells at ${cell(modified)} are bottlenecks connecting ${region(regionMap.islands)}, so they must be filled in`
            )
        );
        progress = true;
      }
    }
    return progress;
  }
}

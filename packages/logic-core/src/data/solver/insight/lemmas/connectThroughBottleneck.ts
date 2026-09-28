import GridData from '../../../grid.js';
import { Color, Position } from '../../../primitives.js';
import { cell, modifyTiles, area, setOneColor } from '../helper.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { NodeId } from '../stores/regionGraph.js';
import { AreaId } from '../stores/areaStore.js';

/**
 * Fills articulation points (bottlenecks) that a region must pass through to connect its areas.
 *
 * An articulation point only qualifies if removing it splits the region's graph into parts where
 * at least two parts each contain an area of the region — being an articulation point on the
 * shortest path between two areas is not sufficient, since the areas might still connect through
 * an alternative route while the articulation point only separates off an irrelevant branch.
 * The articulation point's own node counts as a part when it contains a region area: such an area
 * is logically connected to the region but still gray, so the bottleneck must be filled to
 * realize the connection.
 */
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

      const graph = regionInfo.getRegionGraph();
      // Map each graph node to the region area it contains, if any.
      const nodeToArea = new Map<NodeId, AreaId>();
      for (const areaId of regionInfo.connectedAreas) {
        const pos = regions.toPosition(areaId);
        nodeToArea.set(graph.getId(pos.x, pos.y), areaId);
      }
      for (const articulationPoint of graph.articulationPoints) {
        // Split the graph by removing the articulation point, and collect the region
        // areas contained in each resulting component. The articulation point's own node
        // counts as a part when it contains a region area: that area is logically connected
        // to the region (e.g. by forced region expansion) but its cells are still gray, so
        // the bottleneck itself must be filled to realize the connection.
        const visited = new Set<NodeId>([articulationPoint]);
        const separatedAreas: AreaId[][] = [];
        for (const startId of graph.idToPositions.keys()) {
          if (visited.has(startId)) continue;
          const componentAreas: AreaId[] = [];
          const queue: NodeId[] = [startId];
          visited.add(startId);
          while (queue.length > 0) {
            const node = queue.pop()!;
            const areaId = nodeToArea.get(node);
            if (areaId !== undefined) componentAreas.push(areaId);
            for (const neighbor of graph.adjacency.get(node)!) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
          if (componentAreas.length > 0) separatedAreas.push(componentAreas);
        }
        const bottleneckArea = nodeToArea.get(articulationPoint);
        const partCount = separatedAreas.length + (bottleneckArea ? 1 : 0);
        if (partCount < 2) continue;

        const chokepoints = graph.getPositions(articulationPoint);
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
        const area1 = regions.toPosition(
          bottleneckArea ?? separatedAreas[0][0]
        );
        const area2 = regions.toPosition(
          bottleneckArea ? separatedAreas[0][0] : separatedAreas[1][0]
        );
        const proof = this.proof().difficulty(3);
        regions.explainRegion(regionInfo, proof, [
          ...chokepoints,
          area1,
          area2,
        ]);
        context.setTiles(
          newTiles,
          proof.describe(
            `Cells at ${cell(modified)} are bottlenecks connecting ${area([area1, area2])}, so they must be filled in`
          )
        );
        progress = true;
      }
    }
    return progress;
  }
}

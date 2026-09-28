import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { area, cell } from '../helper.js';
import { NodeId } from '../stores/regionGraph.js';

/**
 * Forces a region to expand through a bottleneck when the cells available behind the bottleneck
 * are fewer than the region's deduced minimum size.
 *
 * Removing all articulation points that are not already part of a region splits its graph into
 * disconnected "patches" (articulation points belonging to the region are territory rather than
 * exits, so they are kept). If a patch contains cells of the region but is smaller than the
 * region's deduced minimum size, the region must grow beyond the patch. When the patch is
 * adjacent to exactly one articulation point, every path out of the patch passes through it, so
 * that bottleneck must belong to the region.
 */
export default class ForcedRegionExpansion extends InsightLemma {
  public readonly id = 'forced-region-expansion';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const regionSizes = context.regionSizes;
    let progress = false;
    for (const region of context.regions.regions.values()) {
      if (regionSizes.getPossibilities(region) === null) continue;
      const minPossible = regionSizes.minPossible(region);
      const regionMap = region.getRegionMap();
      const graph = region.getRegionGraph();
      const articulationPoints = graph.articulationPoints;
      if (articulationPoints.size === 0) continue;

      // Articulation points that already belong to the region are kept: they are part of the
      // region's territory, not exits from it.
      const removableArticulationPoints = new Set<NodeId>();
      for (const id of articulationPoints) {
        const inRegion = graph
          .getPositions(id)
          .some(position => regionMap[position.y][position.x] === true);
        if (!inRegion) removableArticulationPoints.add(id);
      }
      if (removableArticulationPoints.size === 0) continue;

      // Split the graph into patches by removing the remaining articulation points.
      const visited = new Set<NodeId>();
      for (const startId of graph.idToPositions.keys()) {
        if (removableArticulationPoints.has(startId) || visited.has(startId))
          continue;
        const patch: NodeId[] = [];
        const queue: NodeId[] = [startId];
        visited.add(startId);
        while (queue.length > 0) {
          const node = queue.pop()!;
          patch.push(node);
          for (const neighbor of graph.adjacency.get(node)!) {
            if (
              removableArticulationPoints.has(neighbor) ||
              visited.has(neighbor)
            )
              continue;
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }

        let trueCells = 0;
        let availableCells = 0;
        const adjacentArticulationPoints = new Set<NodeId>();
        for (const node of patch) {
          for (const position of graph.getPositions(node)) {
            availableCells++;
            if (regionMap[position.y][position.x] === true) trueCells++;
          }
          for (const neighbor of graph.adjacency.get(node)!) {
            if (removableArticulationPoints.has(neighbor))
              adjacentArticulationPoints.add(neighbor);
          }
        }
        if (trueCells === 0) continue;
        if (availableCells >= minPossible) continue;
        if (adjacentArticulationPoints.size !== 1) continue;

        const bottleneck = [...adjacentArticulationPoints][0];
        const bottleneckPositions = graph.getPositions(bottleneck);
        const target = bottleneckPositions.find(
          position => regionMap[position.y][position.x] !== true
        );
        if (!target) continue;
        if (context.regions.isConnected(target, region.positions[0])) continue;
        const proof = this.proof().difficulty(3);
        regionSizes.minPossible(region, proof);
        context.regions.explainRegion(region, proof, [
          ...patch.flatMap(node => graph.getPositions(node)),
          ...bottleneckPositions,
        ]);
        const modified = context.regions.addConnected(
          target,
          region.positions[0],
          proof.describe(
            `Region at ${area(region.positions[0])} must expand into the bottleneck at ${cell(bottleneckPositions)} because it needs at least ${minPossible} cells but only ${availableCells} are available behind the bottleneck`
          )
        );
        progress ||= modified;
      }
    }
    return progress;
  }
}

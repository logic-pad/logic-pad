import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { instance as regionAreaInstance } from '../../../rules/regionAreaRule.js';
import { area, cell } from '../helper.js';
import { NodeId } from '../stores/regionGraph.js';

/**
 * Forces a region to expand through an articulation point of its region graph when the cells that
 * would remain reachable without it are fewer than the region's deduced minimum size.
 *
 * For each candidate bottleneck — an articulation point that is not already part of the region —
 * the graph is split by removing that single cell. If all of the region's cells stay in one
 * component and that component offers fewer cells than the region needs, the region cannot
 * afford to leave the bottleneck empty, so it must absorb it.
 *
 * Bottlenecks are evaluated one at a time rather than all at once: a narrow corridor attached to
 * the region consists of articulation points itself, and removing them together would shred the
 * corridor into pieces that individually look irrelevant, hiding the fact that the whole
 * corridor is too small to satisfy the region on its own.
 */
export default class ForcedRegionExpansion extends InsightLemma {
  public readonly id = 'forced-region-expansion';

  public isApplicable(grid: GridData): boolean {
    return (
      !!grid.findSymbol(symbol => symbol.id === areaNumberInstance.id) ||
      !!grid.findRule(rule => rule.id === regionAreaInstance.id)
    );
  }

  public apply(context: InsightContext): boolean {
    const regionSizes = context.regionSizes;
    let progress = false;
    for (const region of context.regions.regions.values()) {
      if (regionSizes.getPossibilities(region) === null) continue;
      const minPossible = regionSizes.minPossible(region);
      const regionMap = region.getRegionMap();
      const graph = region.getRegionGraph();

      const trueNodes = new Set<NodeId>();
      for (const id of graph.idToPositions.keys()) {
        if (graph.getPositions(id).some(p => regionMap[p.y][p.x] === true))
          trueNodes.add(id);
      }
      if (trueNodes.size === 0) continue;

      // Articulation points that already belong to the region are territory, not exits.
      const candidates = [...graph.articulationPoints].filter(
        id => !graph.getPositions(id).some(p => regionMap[p.y][p.x] === true)
      );

      for (const bottleneck of candidates) {
        const seed = trueNodes.values().next().value!;
        const component = new Set<NodeId>([seed]);
        const queue: NodeId[] = [seed];
        let split = false;
        while (queue.length > 0) {
          const node = queue.pop()!;
          for (const neighbor of graph.adjacency.get(node)!) {
            if (neighbor === bottleneck || component.has(neighbor)) continue;
            component.add(neighbor);
            queue.push(neighbor);
          }
        }
        for (const id of trueNodes) {
          if (!component.has(id)) {
            split = true;
            break;
          }
        }
        // Splitting the region's own cells is a connectivity contradiction, which
        // connect-through-bottleneck reports instead.
        if (split) continue;

        let availableCells = 0;
        for (const id of component) {
          availableCells += graph.getPositions(id).length;
        }
        if (availableCells >= minPossible) continue;

        const bottleneckPositions = graph.getPositions(bottleneck);
        const target = bottleneckPositions[0];
        if (context.regions.isConnected(target, region.positions[0])) continue;
        const proof = this.proof().difficulty(3);
        regionSizes.minPossible(region, proof);
        context.regions.explainRegion(region, proof, [
          ...[...component].flatMap(id => graph.getPositions(id)),
          ...bottleneckPositions,
        ]);
        const modified = context.regions.addConnected(
          target,
          region.positions[0],
          proof.describe(
            `Region at ${area(region.positions[0])} must expand into the bottleneck at ${cell(bottleneckPositions)} because it needs at least ${minPossible} cells but only ${availableCells} remain reachable without it`
          )
        );
        progress ||= modified;
        if (modified) return true;
      }
    }
    return progress;
  }
}

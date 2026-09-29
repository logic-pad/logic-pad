import GridData from '../../../grid.js';
import { Color, Position } from '../../../primitives.js';
import { area, cell, modifyTiles, setColor } from '../helper.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';

/**
 * Colors gray areas that belong to a region whose color is already known. Lemmas can deduce
 * that a gray area is connected to a region (e.g. forced region expansion connecting a
 * bottleneck) without coloring its cells; since every cell of a region shares its color,
 * those gray cells must take the region's color.
 */
export default class ColorConnectedRegions extends InsightLemma {
  public readonly id = 'color-connected-regions';

  public isApplicable(_grid: GridData): boolean {
    return true;
  }

  public apply(context: InsightContext): boolean {
    let progress = false;
    for (const region of context.regions.regions.values()) {
      if (region.color === Color.Gray) continue;
      const grayAreas: Position[][] = [];
      let anchor: Position | null = null;
      for (const areaId of region.connectedAreas) {
        const areaInfo = context.areas.get(areaId);
        if (!areaInfo) continue;
        if (areaInfo.color === Color.Gray) {
          grayAreas.push(areaInfo.positions);
        } else {
          anchor ??= areaInfo.positions[0];
        }
      }
      if (grayAreas.length === 0 || !anchor) continue;
      const modified: Position[] = [];
      const newTiles = modifyTiles(context.grid);
      for (const positions of grayAreas) {
        for (const pos of positions) {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
          setColor(context.grid, newTiles, pos.x, pos.y, region.color);
          modified.push(pos);
        }
      }
      if (modified.length === 0) continue;
      const proof = this.proof().difficulty(1);
      context.regions.explainRegion(region, proof, modified);
      context.setTiles(
        newTiles,
        proof.describe(
          `Cells at ${cell(modified)} must be ${region.color} because they are connected to ${area(anchor)}`
        )
      );
      progress = true;
    }
    return progress;
  }
}

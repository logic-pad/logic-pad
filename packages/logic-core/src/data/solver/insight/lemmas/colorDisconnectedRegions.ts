import GridData from '../../../grid.js';
import { Color } from '../../../primitives.js';
import { area, cell, modifyTiles, setOppositeColor } from '../helper.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';

export default class ColorDisconnectedRegions extends InsightLemma {
  public readonly id = 'color-disconnected-regions';

  public isApplicable(_grid: GridData): boolean {
    return true;
  }

  public apply(context: InsightContext): boolean {
    let progress = false;
    for (let y = 0; y < context.grid.height; y++) {
      for (let x = 0; x < context.grid.width; x++) {
        const tile = context.grid.getTile(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        if (x > 0) {
          const modified = this.applyToRegion(context, x, y, x - 1, y);
          progress ||= modified;
        }
        if (y > 0) {
          const modified = this.applyToRegion(context, x, y, x, y - 1);
          progress ||= modified;
        }
        if (x < context.grid.width - 1) {
          const modified = this.applyToRegion(context, x, y, x + 1, y);
          progress ||= modified;
        }
        if (y < context.grid.height - 1) {
          const modified = this.applyToRegion(context, x, y, x, y + 1);
          progress ||= modified;
        }
      }
    }
    return progress;
  }

  private applyToRegion(
    context: InsightContext,
    x: number,
    y: number,
    x2: number,
    y2: number
  ): boolean {
    const thisPos = { x, y };
    const otherPos = { x: x2, y: y2 };
    const otherRegion = context.regions.get(otherPos);
    if (otherRegion && otherRegion.color !== Color.Gray) {
      const proof = this.proof().difficulty(1);
      if (context.regions.isDisconnected(thisPos, otherPos, proof)) {
        const newTiles = modifyTiles(context.grid);
        setOppositeColor(context.grid, newTiles, x, y, otherRegion.color);
        context.setTiles(
          newTiles,
          proof.describe(
            `Cell at ${cell(thisPos)} must not be ${otherRegion.color} because it is disconnected from ${area(otherRegion.positions[0])}`
          )
        );
        return true;
      }
    }
    return false;
  }
}

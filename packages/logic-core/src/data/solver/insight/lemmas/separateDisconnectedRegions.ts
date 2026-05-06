import GridData from '../../../grid.js';
import { Color, Position } from '../../../primitives.js';
import { area, cell, modifyTiles, setOppositeColor } from '../helper.js';
import InsightContext from '../insightContext.js';
import { Region, RegionPair } from '../stores/regionStore.js';
import Proof from '../types/proof.js';
import InsightLemma from './insightLemma.js';

interface Disconnection {
  positions: Position[];
  proof: Proof;
}

export default class SeparateDisconnectedRegions extends InsightLemma {
  public readonly id = 'separate-disconnected-regions';

  public isApplicable(_grid: GridData): boolean {
    return true;
  }

  public apply(context: InsightContext): boolean {
    const map = new Map<RegionPair, Disconnection | null>();
    for (let y = 0; y < context.grid.height; y++) {
      for (let x = 0; x < context.grid.width; x++) {
        const tile = context.grid.getTile(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        const neighbors = new Set<Region>();
        if (x > 0) {
          const leftRegion = context.regions.get({ x: x - 1, y });
          if (leftRegion) neighbors.add(leftRegion);
        }
        if (y > 0) {
          const upRegion = context.regions.get({ x, y: y - 1 });
          if (upRegion) neighbors.add(upRegion);
        }
        if (x < context.grid.width - 1) {
          const rightRegion = context.regions.get({ x: x + 1, y });
          if (rightRegion) neighbors.add(rightRegion);
        }
        if (y < context.grid.height - 1) {
          const downRegion = context.regions.get({ x, y: y + 1 });
          if (downRegion) neighbors.add(downRegion);
        }
        if (neighbors.size < 2) continue;
        const regions = [...neighbors];
        for (let i = 0; i < regions.length; i++) {
          for (let j = i + 1; j < regions.length; j++) {
            const regionA = regions[i];
            const regionB = regions[j];
            const pair = context.regions.toRegionPair(regionA.id, regionB.id);
            let existing = map.get(pair);
            if (existing === null) continue;
            if (!existing) {
              const proof = this.proof().difficulty(1);
              if (
                regionA.color !== Color.Gray &&
                regionA.color === regionB.color &&
                context.regions.isDisconnected(
                  regionA.positions[0],
                  regionB.positions[0],
                  proof
                )
              ) {
                existing = { positions: [{ x, y }], proof };
                map.set(pair, existing);
              } else {
                map.set(pair, null);
              }
            }
            if (existing) {
              existing.positions.push({ x, y });
            }
          }
        }
      }
    }
    let progress = false;
    for (const [pair, disconnection] of map.entries()) {
      if (!disconnection) continue;
      const [rawA, rawB] = context.regions.fromRegionPair(pair);
      const regionA = context.regions.get(rawA)!;
      const regionB = context.regions.get(rawB)!;
      const color =
        regionA.color === Color.Gray ? regionB.color : regionA.color;
      const newTiles = modifyTiles(context.grid);
      for (const pos of disconnection.positions) {
        setOppositeColor(context.grid, newTiles, pos.x, pos.y, color);
      }
      context.setTiles(
        newTiles,
        disconnection.proof.describe(
          `Cells at ${cell(disconnection.positions)} must be ${color} to separate ${area(regionA.positions[0])} and ${area(regionB.positions[0])}`
        )
      );
      progress = true;
    }
    return progress;
  }
}

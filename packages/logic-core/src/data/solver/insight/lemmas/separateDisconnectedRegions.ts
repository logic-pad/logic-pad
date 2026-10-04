import GridData, { NEIGHBOR_OFFSETS } from '../../../grid.js';
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
    const grid = context.grid;
    const map = new Map<RegionPair, Disconnection | null>();
    const processed = new Set<string>();
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        // A merged tile is one cell for coloring purposes, so the regions it separates are the
        // neighbors of all of its cells: two cells of the same tile can touch two regions that
        // no single cell of it touches.
        const cells = grid.connections.getConnectedTiles({ x, y });
        if (cells.some(pos => processed.has(`${pos.x},${pos.y}`))) continue;
        for (const pos of cells) processed.add(`${pos.x},${pos.y}`);
        if (cells.some(pos => grid.getTile(pos.x, pos.y).fixed)) continue;
        const own = context.regions.get({ x, y });
        const neighbors = new Set<Region>();
        for (const pos of cells) {
          for (const offset of NEIGHBOR_OFFSETS) {
            const next = { x: pos.x + offset.x, y: pos.y + offset.y };
            if (!grid.isPositionValid(next.x, next.y)) continue;
            const region = context.regions.get(next);
            if (!region || region.id === own?.id) continue;
            neighbors.add(region);
          }
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
                existing = { positions: [], proof };
                map.set(pair, existing);
              } else {
                map.set(pair, null);
              }
            }
            if (existing) {
              existing.positions.push(...cells);
            }
          }
        }
      }
    }
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
          `Cells at ${cell(disconnection.positions)} must be ${color === Color.Dark ? Color.Light : Color.Dark} to separate ${area(regionA.positions[0])} and ${area(regionB.positions[0])}`
        )
      );
      return true;
    }
    return false;
  }
}

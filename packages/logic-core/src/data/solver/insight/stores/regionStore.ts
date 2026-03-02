import { Color, Position } from '../../../primitives.js';
import Proof from '../types/proof.js';
import DisjointSet from './disjointSet.js';
import InsightStore from './insightStore.js';
import type InsightContext from '../insightContext.js';
import { cell, region } from '../helper.js';
import { Graph } from './graph.js';
import { array } from '../../../dataHelper.js';

export type RegionMap = (boolean | null)[][];

/**
 * Tracks region connectivity and logical region relations.
 */
export default class RegionStore extends InsightStore {
  private cellDisjointSet = new DisjointSet(0);
  private regionDisjointSet = new DisjointSet(0);
  private connectionProofs = new Map<string, Proof>();
  private regionConnectionProofs = new Map<number, Set<Proof>>();
  private disconnectionProofs = new Map<string, Proof>();
  private cachedRegionMap = new Map<number, RegionMap>();
  private cachedGraphs = new Map<number, Graph>();

  public readonly id = 'regionStore';

  public constructor(context: InsightContext) {
    super(context);
    this.recompute();
  }

  /**
   * Recomputes region representatives from current grid colors.
   */
  public onGridUpdate(): void {
    this.recompute();
  }

  /**
   * Checks whether two cells are connected, including lemma deductions.
   */
  public isConnected(cellA: Position, cellB: Position, proof?: Proof): boolean {
    const valueA = this.toCellValue(cellA.x, cellA.y);
    const valueB = this.toCellValue(cellB.x, cellB.y);

    const repA = this.cellDisjointSet.find(valueA);
    const repB = this.cellDisjointSet.find(valueB);

    if (repA === repB) return true;

    const key = this.pairKey(repA, repB);
    const deduction = this.connectionProofs.get(key);
    if (deduction) {
      proof?.add(deduction);
      return true;
    }

    const regionRepA = this.regionDisjointSet.find(repA);
    const regionRepB = this.regionDisjointSet.find(repB);
    if (regionRepA === regionRepB) {
      const regionProofs = this.regionConnectionProofs.get(regionRepA);
      if (regionProofs) {
        for (const regionProof of regionProofs) {
          proof?.add(regionProof);
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Checks whether two cells are disconnected, including lemma deductions.
   */
  public isDisconnected(
    cellA: Position,
    cellB: Position,
    proof?: Proof
  ): boolean {
    const colorA = this.context.grid.getTile(cellA.x, cellA.y).color;
    const colorB = this.context.grid.getTile(cellB.x, cellB.y).color;
    if (colorA !== Color.Gray && colorB !== Color.Gray && colorA !== colorB) {
      return true;
    }

    const valueA = this.toCellValue(cellA.x, cellA.y);
    const valueB = this.toCellValue(cellB.x, cellB.y);

    const repA = this.cellDisjointSet.find(valueA);
    const repB = this.cellDisjointSet.find(valueB);

    if (repA === repB) return false;

    const key = this.pairKey(repA, repB);
    const deduction = this.disconnectionProofs.get(key);
    if (deduction) {
      proof?.add(deduction);
      return true;
    }

    return false;
  }

  /**
   * Records a logical connection between two regions. Returns true if the connection was successfully recorded.
   */
  public addConnected(cellA: Position, cellB: Position, proof: Proof): boolean {
    const valueA = this.toCellValue(cellA.x, cellA.y);
    const valueB = this.toCellValue(cellB.x, cellB.y);
    const repA = this.cellDisjointSet.find(valueA);
    const repB = this.cellDisjointSet.find(valueB);

    if (repA === repB) return false;

    const key = this.pairKey(repA, repB);
    const disconnected = this.disconnectionProofs.get(key);
    if (disconnected) {
      throw this.error(
        `Cannot connect ${region(cellA)} and ${region(cellB)}: they are already known to be disconnected.`
      );
    }
    const existing = this.connectionProofs.get(key);
    if (existing) {
      return false;
    }

    this.connectionProofs.set(key, proof);
    const oldRepA = this.regionDisjointSet.find(repA);
    const oldRepB = this.regionDisjointSet.find(repB);
    if (oldRepA === oldRepB) {
      // The regions were already transitively connected, so we just need to add the proof to the region proofs.
      const regionProofs =
        this.regionConnectionProofs.get(oldRepA) ?? new Set<Proof>();
      regionProofs.add(proof);
      this.regionConnectionProofs.set(oldRepA, regionProofs);
      return true;
    }
    this.regionDisjointSet.union(repA, repB);
    const newRep = this.regionDisjointSet.find(repA);
    this.regionConnectionProofs.set(
      newRep,
      new Set([
        proof,
        ...(this.regionConnectionProofs.get(oldRepA) || []),
        ...(this.regionConnectionProofs.get(oldRepB) || []),
      ])
    );
    this.regionConnectionProofs.delete(oldRepA);
    this.regionConnectionProofs.delete(oldRepB);
    return true;
  }

  /**
   * Records a logical disconnection between two regions. Returns true if the disconnection was successfully recorded.
   */
  public addDisconnected(
    cellA: Position,
    cellB: Position,
    proof: Proof
  ): boolean {
    const valueA = this.toCellValue(cellA.x, cellA.y);
    const valueB = this.toCellValue(cellB.x, cellB.y);
    const repA = this.cellDisjointSet.find(valueA);
    const repB = this.cellDisjointSet.find(valueB);

    if (repA === repB) return false;

    const key = this.pairKey(repA, repB);
    const connected = this.connectionProofs.get(key);
    if (connected) {
      throw this.error(
        `Cannot disconnect ${region(cellA)} and ${region(cellB)}: they are already known to be connected.`
      );
    }
    const existing = this.disconnectionProofs.get(key);
    if (existing) {
      return false;
    }

    this.disconnectionProofs.set(key, proof);
    return true;
  }

  /**
   * Get a map of cells that are in the same region as the given cell (`true`), in a different region (`false`), or unknown
   * but possible (`null`). Includes deductions from lemmas.
   */
  public getRegionMap(region: Position, proof?: Proof): RegionMap {
    const value = this.toCellValue(region.x, region.y);
    const cached = this.cachedRegionMap.get(value);
    if (cached) return cached;

    const grid = this.context.grid;
    const map: RegionMap = Array.from({ length: grid.height }, () =>
      Array.from({ length: grid.width }, () => false)
    );
    const tile = grid.getTile(region.x, region.y);
    if (!tile.exists) {
      throw this.error(`Cell ${cell(region)} does not exist.`);
    }
    if (tile.color !== Color.Gray) {
      grid.iterateArea(
        region,
        t => t.color === tile.color || t.color === Color.Gray,
        (_, x, y) => {
          map[y][x] = null;
        }
      );
      grid.iterateArea(
        region,
        t => t.color === tile.color,
        (_, x, y) => {
          map[y][x] = true;
        }
      );
    } else {
      grid.iterateArea(
        region,
        t => t.color === Color.Dark || t.color === Color.Gray,
        (_, x, y) => {
          map[y][x] = null;
        }
      );
      grid.iterateArea(
        region,
        t => t.color === Color.Light || t.color === Color.Gray,
        (_, x, y) => {
          map[y][x] = null;
        }
      );
      map[region.y][region.x] = true;
    }
    for (const [key, existing] of this.connectionProofs.entries()) {
      const [rawA, rawB] = this.fromPairKey(key);
      if (rawA !== value && rawB !== value) continue;
      const otherPos = this.fromCellValue(rawA === value ? rawB : rawA);
      const otherTile = grid.getTile(otherPos.x, otherPos.y);
      if (!otherTile.exists) {
        throw this.error(`Cell ${cell(otherPos)} does not exist.`);
      }
      if (otherTile.color !== Color.Gray) {
        grid.iterateArea(
          otherPos,
          t => t.color === otherTile.color,
          (_, x, y) => {
            map[y][x] = true;
          }
        );
      } else {
        map[otherPos.y][otherPos.x] = true;
      }
      proof?.add(existing);
    }
    for (const [key, existing] of this.disconnectionProofs.entries()) {
      const [rawA, rawB] = this.fromPairKey(key);
      if (rawA !== value && rawB !== value) continue;
      const otherPos = this.fromCellValue(rawA === value ? rawB : rawA);
      const otherTile = grid.getTile(otherPos.x, otherPos.y);
      if (!otherTile.exists) {
        throw this.error(`Cell ${cell(otherPos)} does not exist.`);
      }
      if (otherTile.color !== Color.Gray) {
        grid.iterateArea(
          otherPos,
          (t, x, y) => {
            if (otherTile.color === tile.color) {
              const { x: arrayX, y: arrayY } = grid.toArrayCoordinates(x, y);
              map[arrayY][arrayX] = false;
            }
            return t.color === otherTile.color;
          },
          (_, x, y) => {
            if (otherTile.color !== tile.color) {
              map[y][x] = false;
            }
          }
        );
      } else {
        map[otherPos.y][otherPos.x] = false;
      }
      proof?.add(existing);
    }
    this.cachedRegionMap.set(value, map);
    return map;
  }

  public getGraph(region: Position, proof?: Proof): Graph {
    const value = this.toCellValue(region.x, region.y);
    const cached = this.cachedGraphs.get(value);
    if (cached) return cached;

    const regionMap = this.getRegionMap(region, proof);
    const grid = this.context.grid;
    const graph = new Graph(grid);
    const visited = array(grid.width, grid.height, () => false);
    for (let y = 0; y < regionMap.length; y++) {
      for (let x = 0; x < regionMap[y].length; x++) {
        if (regionMap[y][x] === false) continue;
        if (visited[y][x]) continue;
        const id = graph.createNode();
        const connected = grid.connections.getConnectedTiles({ x, y });
        for (const tile of connected) {
          if (regionMap[tile.y][tile.x] === false) continue;
          visited[tile.y][tile.x] = true;
          graph.addToNode(id, tile.x, tile.y);
        }
      }
    }

    for (let y = 0; y < regionMap.length; y++) {
      for (let x = 0; x < regionMap[y].length; x++) {
        if (regionMap[y][x] === false) continue;
        if (x < regionMap[y].length - 1 && regionMap[y][x + 1] !== false) {
          graph.connect(x, y, x + 1, y);
        }
        if (y < regionMap.length - 1 && regionMap[y + 1][x] !== false) {
          graph.connect(x, y, x, y + 1);
        }
      }
    }

    this.cachedGraphs.set(value, graph);
    return graph;
  }

  private recompute(): void {
    const grid = this.context.grid;
    const size = grid.width * grid.height;
    this.cellDisjointSet = new DisjointSet(size);
    this.cachedRegionMap.clear();
    this.cachedGraphs.clear();

    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const tile = grid.getTile(col, row);
        if (!tile.exists || tile.color === Color.Gray) continue;

        if (col + 1 < grid.width) {
          const right = grid.getTile(col + 1, row);
          if (
            right.exists &&
            right.color !== Color.Gray &&
            right.color === tile.color
          ) {
            this.cellDisjointSet.union(
              this.toCellValue(row, col),
              this.toCellValue(row, col + 1)
            );
          }
        }

        if (row + 1 < grid.height) {
          const down = grid.getTile(col, row + 1);
          if (
            down.exists &&
            down.color !== Color.Gray &&
            down.color === tile.color
          ) {
            this.cellDisjointSet.union(
              this.toCellValue(row, col),
              this.toCellValue(row + 1, col)
            );
          }
        }
      }
    }

    this.connectionProofs = this.rekeyMap(this.connectionProofs);
    this.disconnectionProofs = this.rekeyMap(this.disconnectionProofs);

    this.regionDisjointSet = new DisjointSet(size);
    this.regionConnectionProofs = new Map<number, Set<Proof>>();
    for (const [key] of this.connectionProofs.entries()) {
      const [repA, repB] = this.fromPairKey(key);
      this.regionDisjointSet.union(repA, repB);
    }
    for (const [key, proof] of this.connectionProofs.entries()) {
      const [rawA] = this.fromPairKey(key);
      const repA = this.regionDisjointSet.find(rawA);
      this.regionConnectionProofs.set(
        repA,
        (this.regionConnectionProofs.get(repA) ?? new Set<Proof>()).add(proof)
      );
    }
  }

  private rekeyMap(map: Map<string, Proof>): Map<string, Proof> {
    const rekeyed = new Map<string, Proof>();

    for (const [key, deduction] of map.entries()) {
      const [rawA, rawB] = this.fromPairKey(key);

      const repA = this.cellDisjointSet.find(rawA);
      const repB = this.cellDisjointSet.find(rawB);

      if (repA === repB) continue;

      const pair = this.pairKey(repA, repB);

      rekeyed.set(pair, deduction);
    }

    return rekeyed;
  }

  private toCellValue(x: number, y: number): number {
    return y * this.context.grid.width + x;
  }

  private fromCellValue(value: number): Position {
    const x = value % this.context.grid.width;
    const y = Math.floor(value / this.context.grid.width);
    return { x, y };
  }

  private pairKey(valueA: number, valueB: number): string {
    if (valueA < valueB) return `${valueA},${valueB}`;
    return `${valueB},${valueA}`;
  }

  private fromPairKey(key: string): [number, number] {
    const [rawA, rawB] = key.split(',').map(value => Number.parseInt(value));
    if (!Number.isFinite(rawA) || !Number.isFinite(rawB)) {
      throw this.error('Invalid pair key: ' + key);
    }
    return [rawA, rawB];
  }
}

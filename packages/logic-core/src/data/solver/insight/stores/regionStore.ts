import { Color, Position } from '../../../primitives.js';
import Proof from '../types/proof.js';
import DisjointSet from './disjointSet.js';
import InsightStore from './insightStore.js';
import type InsightContext from '../insightContext.js';
import { cell, region } from '../helper.js';

export type RegionMap = (boolean | null)[][];

/**
 * Tracks region connectivity and logical region relations.
 */
export default class RegionStore extends InsightStore {
  private disjointSet = new DisjointSet(0);
  private connectedByLemma = new Map<string, Proof>();
  private disconnectedByLemma = new Map<string, Proof>();
  private cachedRegionMap = new Map<number, RegionMap>();

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

    const repA = this.disjointSet.find(valueA);
    const repB = this.disjointSet.find(valueB);

    if (repA === repB) return true;

    const key = this.pairKey(repA, repB);
    const deduction = this.connectedByLemma.get(key);
    if (deduction) {
      proof?.add(deduction);
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

    const repA = this.disjointSet.find(valueA);
    const repB = this.disjointSet.find(valueB);

    if (repA === repB) return false;

    const key = this.pairKey(repA, repB);
    const deduction = this.disconnectedByLemma.get(key);
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
    const repA = this.disjointSet.find(valueA);
    const repB = this.disjointSet.find(valueB);

    if (repA === repB) return false;

    const key = this.pairKey(repA, repB);
    const disconnected = this.disconnectedByLemma.get(key);
    if (disconnected) {
      throw this.error(
        `Cannot connect ${region(cellA)} and ${region(cellB)}: they are already known to be disconnected.`
      );
    }
    const existing = this.connectedByLemma.get(key);
    if (existing) {
      return false;
    }

    this.connectedByLemma.set(key, proof);
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
    const repA = this.disjointSet.find(valueA);
    const repB = this.disjointSet.find(valueB);

    if (repA === repB) return false;

    const key = this.pairKey(repA, repB);
    const connected = this.connectedByLemma.get(key);
    if (connected) {
      throw this.error(
        `Cannot disconnect ${region(cellA)} and ${region(cellB)}: they are already known to be connected.`
      );
    }
    const existing = this.disconnectedByLemma.get(key);
    if (existing) {
      return false;
    }

    this.disconnectedByLemma.set(key, proof);
    return true;
  }

  /**
   * Get a map of cells that are in the same region as the given cell (true), in a different region (false), or unknown
   * but possible (null). Includes deductions from lemmas.
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
    for (const [key, existing] of this.connectedByLemma.entries()) {
      const [rawA, rawB] = this.fromPairKey(key);
      if (rawA !== value && rawB === value) continue;
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
    for (const [key, existing] of this.disconnectedByLemma.entries()) {
      const [rawA, rawB] = this.fromPairKey(key);
      if (rawA !== value && rawB === value) continue;
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

  private recompute(): void {
    const grid = this.context.grid;
    const size = grid.width * grid.height;
    this.disjointSet = new DisjointSet(size);
    this.cachedRegionMap.clear();

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
            this.disjointSet.union(
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
            this.disjointSet.union(
              this.toCellValue(row, col),
              this.toCellValue(row + 1, col)
            );
          }
        }
      }
    }

    this.connectedByLemma = this.rekeyMap(this.connectedByLemma);
    this.disconnectedByLemma = this.rekeyMap(this.disconnectedByLemma);
  }

  private rekeyMap(map: Map<string, Proof>): Map<string, Proof> {
    const rekeyed = new Map<string, Proof>();

    for (const [key, deduction] of map.entries()) {
      const [rawA, rawB] = this.fromPairKey(key);

      const repA = this.disjointSet.find(rawA);
      const repB = this.disjointSet.find(rawB);

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

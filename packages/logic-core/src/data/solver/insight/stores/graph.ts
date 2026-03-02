import GridData from '../../../grid.js';
import { Position } from '../../../primitives.js';
import InsightError from '../types/insightError.js';

export class Graph {
  public idToPositions = new Map<number, number[]>();
  public positionToId = new Map<number, number>();
  public adjacency = new Map<number, Set<number>>();

  private _articulationPoints?: Set<number>;
  private _shortestPaths = new Map<string, number[]>();

  public get articulationPoints(): Set<number> {
    this._articulationPoints ??= this.tarjanAlgorithm();
    return this._articulationPoints;
  }

  public constructor(protected grid: GridData) {
    this.grid = grid;
  }

  public createNode(): number {
    const id = this.idToPositions.size;
    this.idToPositions.set(id, []);
    this.adjacency.set(id, new Set<number>());
    this._articulationPoints = undefined;
    return id;
  }

  public addToNode(id: number, x: number, y: number): void {
    const positionValue = this.fromPosition(x, y);
    this.positionToId.set(positionValue, id);
    this.idToPositions.get(id)!.push(positionValue);
  }

  public getId(x: number, y: number): number {
    const id = this.positionToId.get(this.fromPosition(x, y));
    if (id === undefined) {
      throw new InsightError(
        'graph',
        `Cannot find position (${x}, ${y}) in the graph`
      );
    }
    return id;
  }

  public getPositions(id: number): Position[] {
    const positionValues = this.idToPositions.get(id);
    if (!positionValues) {
      throw new InsightError('graph', `Cannot find id ${id} in the graph`);
    }
    return positionValues.map(value => this.toPosition(value));
  }

  public connect(x1: number, y1: number, x2: number, y2: number): void {
    const id1 = this.getId(x1, y1);
    const id2 = this.getId(x2, y2);
    if (id1 === id2) return;
    this.adjacency.get(id1)!.add(id2);
    this.adjacency.get(id2)!.add(id1);
    this._articulationPoints = undefined;
  }

  public shortestPath(id1: number, id2: number): number[] {
    const key = id1 < id2 ? `${id1},${id2}` : `${id2},${id1}`;
    if (this._shortestPaths.has(key)) {
      return this._shortestPaths.get(key)!;
    }
    const path = this.aStar(id1, id2);
    this._shortestPaths.set(key, path);
    return path;
  }

  private fromPosition(x: number, y: number): number {
    return y * this.grid.width + x;
  }

  private toPosition(value: number): Position {
    return {
      x: value % this.grid.width,
      y: Math.floor(value / this.grid.width),
    };
  }

  private tarjanAlgorithm(): Set<number> {
    const visited = new Set<number>();
    const discoveryTime = new Map<number, number>();
    const lowTime = new Map<number, number>();
    const parent = new Map<number, number | null>();
    const childrenCount = new Map<number, number>();
    const articulationPoints = new Set<number>();
    let time = 0;

    for (const id of this.idToPositions.keys()) {
      if (visited.has(id)) continue;

      parent.set(id, null);
      visited.add(id);
      discoveryTime.set(id, time);
      lowTime.set(id, time);
      childrenCount.set(id, 0);
      time += 1;

      const stack: Array<{
        node: number;
        neighbors: number[];
        nextNeighborIndex: number;
      }> = [
        {
          node: id,
          neighbors: [...(this.adjacency.get(id) ?? [])],
          nextNeighborIndex: 0,
        },
      ];

      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const u = frame.node;

        if (frame.nextNeighborIndex < frame.neighbors.length) {
          const v = frame.neighbors[frame.nextNeighborIndex];
          frame.nextNeighborIndex += 1;

          if (!visited.has(v)) {
            parent.set(v, u);
            childrenCount.set(u, (childrenCount.get(u) ?? 0) + 1);

            visited.add(v);
            discoveryTime.set(v, time);
            lowTime.set(v, time);
            childrenCount.set(v, 0);
            time += 1;

            stack.push({
              node: v,
              neighbors: [...(this.adjacency.get(v) ?? [])],
              nextNeighborIndex: 0,
            });
          } else if (v !== parent.get(u)) {
            lowTime.set(u, Math.min(lowTime.get(u)!, discoveryTime.get(v)!));
          }
          continue;
        }

        stack.pop();
        const parentNode = parent.get(u);

        if (parentNode == null) {
          if (parentNode === null && (childrenCount.get(u) ?? 0) > 1) {
            articulationPoints.add(u);
          }
          continue;
        }

        lowTime.set(
          parentNode,
          Math.min(lowTime.get(parentNode)!, lowTime.get(u)!)
        );
        if (lowTime.get(u)! >= discoveryTime.get(parentNode)!) {
          articulationPoints.add(parentNode);
        }
      }
    }

    return articulationPoints;
  }

  private aStar(start: number, goal: number): number[] {
    const openSet = new Set<number>([start]);
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>([[start, 0]]);
    const fScore = new Map<number, number>([
      [start, this.heuristic(start, goal)],
    ]);

    while (openSet.size > 0) {
      let current: number | null = null;
      let lowestFScore = Infinity;
      for (const node of openSet) {
        const score = fScore.get(node) ?? Infinity;
        if (score < lowestFScore) {
          lowestFScore = score;
          current = node;
        }
      }

      if (current === goal) {
        const path: number[] = [];
        while (current !== undefined) {
          path.unshift(current);
          current = cameFrom.get(current)!;
        }
        return path;
      }

      openSet.delete(current!);
      for (const neighbor of this.adjacency.get(current!)!) {
        const tentativeGScore = (gScore.get(current!) ?? Infinity) + 1; // Assuming uniform cost
        if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
          cameFrom.set(neighbor, current!);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(
            neighbor,
            tentativeGScore + this.heuristic(neighbor, goal)
          );
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }
    }

    return []; // No path found
  }

  private heuristic(id1: number, id2: number): number {
    const pos1 = this.toPosition(id1);
    const pos2 = this.toPosition(id2);
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }
}

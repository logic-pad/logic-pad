import GridData from '../../../grid.js';
import { Position } from '../../../primitives.js';
import InsightError from '../types/insightError.js';
import { PositionValue } from './areaStore.js';

declare const graphSymbol: unique symbol;

export type NodeId = number & { [graphSymbol]: 'node' };
export type NodePair = `${NodeId},${NodeId}`;

export class RegionGraph {
  /**
   * Each node gets an auto-incremented id. This map stores the grid positions corresponding to each node id.
   * There can be multiple positions associated with one node because of merged tiles.
   */
  public idToPositions = new Map<NodeId, PositionValue[]>();
  /**
   * Each node gets an auto-incremented id. This map stores the node id corresponding to each grid position.
   */
  public positionToId = new Map<PositionValue, NodeId>();
  /**
   * Adjacency list representing the graph structure. Each node id maps to a set of adjacent node ids.
   */
  public adjacency = new Map<NodeId, Set<NodeId>>();

  private _articulationPoints?: Set<NodeId>;
  private _shortestPaths = new Map<NodePair, NodeId[]>();

  /**
   * Articulation points are nodes that, if removed, would increase the number of connected components in the graph.
   * In the context of the puzzle, these represent chokepoints between different regions where connections must pass through.
   */
  public get articulationPoints(): Set<NodeId> {
    this._articulationPoints ??= this.tarjanAlgorithm();
    return this._articulationPoints;
  }

  public constructor(protected readonly grid: GridData) {
    this.grid = grid;
  }

  public createNode(): NodeId {
    const id = this.idToPositions.size as NodeId;
    this.idToPositions.set(id, []);
    this.adjacency.set(id, new Set<NodeId>());
    this._articulationPoints = undefined;
    return id;
  }

  public addToNode(id: NodeId, x: number, y: number): void {
    const positionValue = this.toPositionValue(x, y);
    this.positionToId.set(positionValue, id);
    this.idToPositions.get(id)!.push(positionValue);
  }

  public getId(x: number, y: number): NodeId {
    const id = this.positionToId.get(this.toPositionValue(x, y));
    if (id === undefined) {
      throw new InsightError(
        'graph',
        `Cannot find position (${x}, ${y}) in the graph`
      );
    }
    return id;
  }

  public getPositions(id: NodeId): Position[] {
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

  /**
   * Find the shortest path between two nodes using the A* algorithm. The heuristic used is the Manhattan distance
   * between the positions of the nodes.
   */
  public shortestPath(id1: NodeId, id2: NodeId): NodeId[] {
    const key = this.toNodePair(id1, id2);
    if (this._shortestPaths.has(key)) {
      return this._shortestPaths.get(key)!;
    }
    const path = this.aStar(id1, id2);
    this._shortestPaths.set(key, path);
    return path;
  }

  private tarjanAlgorithm(): Set<NodeId> {
    const visited = new Set<NodeId>();
    const discoveryTime = new Map<NodeId, number>();
    const lowTime = new Map<NodeId, number>();
    const parent = new Map<NodeId, NodeId | null>();
    const childrenCount = new Map<NodeId, number>();
    const articulationPoints = new Set<NodeId>();
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
        node: NodeId;
        neighbors: NodeId[];
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
          if ((childrenCount.get(u) ?? 0) > 1) {
            articulationPoints.add(u);
          }
          continue;
        }

        lowTime.set(
          parentNode,
          Math.min(lowTime.get(parentNode)!, lowTime.get(u)!)
        );
        // Non-root articulation condition: root is handled separately by children count.
        if (
          parent.get(parentNode) !== null &&
          lowTime.get(u)! >= discoveryTime.get(parentNode)!
        ) {
          articulationPoints.add(parentNode);
        }
      }
    }

    return articulationPoints;
  }

  private aStar(start: NodeId, goal: NodeId): NodeId[] {
    const openSet = new Set<NodeId>([start]);
    const cameFrom = new Map<NodeId, NodeId>();
    const gScore = new Map<NodeId, number>([[start, 0]]);
    const fScore = new Map<NodeId, number>([
      [start, this.heuristic(start, goal)],
    ]);

    while (openSet.size > 0) {
      let current: NodeId | null = null;
      let lowestFScore = Infinity;
      for (const node of openSet) {
        const score = fScore.get(node) ?? Infinity;
        if (score < lowestFScore) {
          lowestFScore = score;
          current = node;
        }
      }

      if (current === goal) {
        const path: NodeId[] = [];
        while (current !== undefined) {
          path.unshift(current);
          current = cameFrom.get(current)!;
        }
        return path;
      }

      openSet.delete(current!);
      for (const neighbor of this.adjacency.get(current!)!) {
        const tentativeGScore =
          (gScore.get(current!) ?? Infinity) + this.nodeWeight(neighbor);
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

  private nodeWeight(id: NodeId): number {
    return this.idToPositions.get(id)?.length ?? 1;
  }

  private heuristic(id1: NodeId, id2: NodeId): number {
    const positions1 = this.idToPositions.get(id1)!;
    const positions2 = this.idToPositions.get(id2)!;
    const pos1 = this.toPosition(positions1[0]);
    const pos2 = this.toPosition(positions2[0]);
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  public toPositionValue(x: number, y: number): PositionValue {
    return (y * this.grid.width + x) as PositionValue;
  }

  public toPosition(positionValue: PositionValue): Position {
    const x = positionValue % this.grid.width;
    const y = Math.floor(positionValue / this.grid.width);
    return { x, y };
  }

  public toNodePair(valueA: NodeId, valueB: NodeId): NodePair {
    if (valueA < valueB) return `${valueA},${valueB}`;
    return `${valueB},${valueA}`;
  }
}

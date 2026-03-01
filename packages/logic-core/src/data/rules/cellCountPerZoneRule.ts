import GridData from '../grid.js';
import { Color, Position } from '../primitives.js';
import Rule from './rule.js';

export interface Zone {
  positions: Position[];
  completed: number;
  possible: number;
}

export type ZoneCounts = {
  zones: Zone[];
  complete: boolean;
};

export default abstract class CellCountPerZoneRule extends Rule {
  public get configExplanation() {
    return 'Use the zone tool to define areas on the grid.';
  }

  /**
   * @param color - The color of the cells to count.
   */
  public constructor(public readonly color: Color) {
    super();
    this.color = color;
  }

  protected getZoneCounts(grid: GridData): ZoneCounts {
    let complete = true;
    const zones = grid.reduceByZone<Zone>(
      (zone, tile, x, y) => {
        zone.positions.push({ x, y });
        if (tile.color === this.color) {
          zone.completed++;
        } else if (tile.color === Color.Gray) {
          zone.possible++;
          complete = false;
        }
        return zone;
      },
      () => ({
        positions: [],
        completed: 0,
        possible: 0,
      })
    );
    return { zones, complete };
  }

  public withColor(color: Color): this {
    return this.copyWith({ color });
  }
}

export const instance = undefined;

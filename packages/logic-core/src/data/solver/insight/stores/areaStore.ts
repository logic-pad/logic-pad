import { array } from '../../../dataHelper.js';
import { Color, Position } from '../../../primitives.js';
import Symbol from '../../../symbols/symbol.js';
import InsightContext from '../insightContext.js';
import InsightStore from './insightStore.js';

declare const positionSymbol: unique symbol;
declare const areaSymbol: unique symbol;

export type PositionValue = number & { [positionSymbol]: 'position' };
export type AreaId = PositionValue & { [areaSymbol]: 'area' };

export class Area {
  public constructor(
    public readonly id: AreaId,
    public readonly color: Color,
    public readonly positions: Position[] = [],
    public readonly symbols: Symbol[] = []
  ) {
    this.id = id;
    this.color = color;
    this.positions = positions;
    this.symbols = symbols;
  }

  public copy(): Area {
    return new Area(
      this.id,
      this.color,
      this.positions.slice(),
      this.symbols.slice()
    );
  }
}

export default class AreaStore extends InsightStore {
  public readonly id = 'area';

  private _cells: (Area | null)[][] = [];
  private _areaList: Area[] = [];

  public constructor(context: InsightContext) {
    super(context);
    this.recompute();
  }

  public get cells(): readonly (readonly (Area | null)[])[] {
    return this._cells;
  }

  public get areaList(): readonly Area[] {
    return this._areaList;
  }

  public get(position: Position | PositionValue): Area | null {
    if (typeof position === 'number') {
      const x = position % this.context.grid.width;
      const y = Math.floor(position / this.context.grid.width);
      return this._cells[y][x];
    } else {
      return this._cells[position.y][position.x];
    }
  }

  public onGridUpdate(): void {
    this.recompute();
  }

  public copyWithContext(context: InsightContext): this {
    const copy = new AreaStore(context);
    copy._cells = this._cells.map(row =>
      row.map(cell => (cell ? cell.copy() : null))
    );
    copy._areaList = this._areaList.map(area => area.copy());
    return copy as this;
  }

  private recompute() {
    const grid = this.context.grid;
    const newCells: (Area | null)[][] = array(
      grid.width,
      grid.height,
      () => null
    );
    const newAreaList: Area[] = [];
    const visited = array(grid.width, grid.height, () => false);
    while (true) {
      const seed = grid.find((t, x, y) => !visited[y][x] && t.exists);
      if (!seed) break;
      const seedTile = grid.getTile(seed.x, seed.y);
      if (seedTile.color === Color.Gray) {
        const area = new Area(
          this.toPositionValue(seed.x, seed.y) as AreaId,
          Color.Gray,
          [seed]
        );
        const positions = grid.connections.getConnectedTiles(seed);
        for (const pos of positions) {
          visited[pos.y][pos.x] = true;
          area.positions.push({ x: pos.x, y: pos.y });
          newCells[pos.y][pos.x] = area;
        }
        newAreaList.push(area);
        continue;
      } else {
        const area = new Area(
          this.toPositionValue(seed.x, seed.y) as AreaId,
          seedTile.color,
          [],
          []
        );
        grid.iterateArea(
          seed,
          t => t.exists && t.color === seedTile.color,
          (_, x, y) => {
            visited[y][x] = true;
            area.positions.push({ x, y });
            newCells[y][x] = area;
          }
        );
        newAreaList.push(area);
      }
    }
    for (const [_, symbols] of grid.symbols.entries()) {
      for (const symbol of symbols) {
        const minX = Math.floor(symbol.x);
        const minY = Math.floor(symbol.y);
        const maxX = Math.ceil(symbol.x);
        const maxY = Math.ceil(symbol.y);
        if (minX >= 0 && minY >= 0) {
          const area = newCells[minY][minX];
          if (area && !area.symbols.includes(symbol)) {
            area.symbols.push(symbol);
          }
        }
        if (minX >= 0 && maxY < grid.height) {
          const area = newCells[maxY][minX];
          if (area && !area.symbols.includes(symbol)) {
            area.symbols.push(symbol);
          }
        }
        if (maxX < grid.width && minY >= 0) {
          const area = newCells[minY][maxX];
          if (area && !area.symbols.includes(symbol)) {
            area.symbols.push(symbol);
          }
        }
        if (maxX < grid.width && maxY < grid.height) {
          const area = newCells[maxY][maxX];
          if (area && !area.symbols.includes(symbol)) {
            area.symbols.push(symbol);
          }
        }
      }
    }
    this._cells = newCells;
    this._areaList = newAreaList;
  }

  public toPositionValue(x: number, y: number): PositionValue {
    return (y * this.context.grid.width + x) as PositionValue;
  }

  public toPosition(positionValue: PositionValue): Position {
    const x = positionValue % this.context.grid.width;
    const y = Math.floor(positionValue / this.context.grid.width);
    return { x, y };
  }
}

import GridData from '../../grid.js';
import { Color, Position } from '../../primitives.js';
import TileData from '../../tile.js';

export function cell(cell: Position | Position[]): string {
  if (Array.isArray(cell)) {
    return `(${cell.map(c => `${c.x},${c.y}`).join(';')})`;
  }
  return `(${cell.x},${cell.y})`;
}

export function area(representative: Position | Position[]): string {
  if (Array.isArray(representative)) {
    return `[${representative.map(c => `${c.x},${c.y}`).join(';')}]`;
  }
  return `[${representative.x},${representative.y}]`;
}

export function setOneColor(
  tiles: TileData[][],
  x: number,
  y: number,
  color: Color
) {
  tiles[y][x] = tiles[y][x].withColor(color);
}

export function setOneOppositeColor(
  tiles: TileData[][],
  x: number,
  y: number,
  color: Color
) {
  const oppositeColor = color === Color.Dark ? Color.Light : Color.Dark;
  setOneColor(tiles, x, y, oppositeColor);
}

export function setColor(
  grid: GridData,
  tiles: TileData[][],
  x: number,
  y: number,
  color: Color
) {
  const changing = grid.connections.getConnectedTiles({ x, y });
  for (const tile of changing) {
    setOneColor(tiles, tile.x, tile.y, color);
  }
}

export function setOppositeColor(
  grid: GridData,
  tiles: TileData[][],
  x: number,
  y: number,
  color: Color
) {
  const oppositeColor = color === Color.Dark ? Color.Light : Color.Dark;
  setColor(grid, tiles, x, y, oppositeColor);
}

interface TileMethods {
  get: (x: number, y: number) => TileData;
  setColor: (x: number, y: number, color: Color) => void;
  setOneColor: (x: number, y: number, color: Color) => void;
  setOppositeColor: (x: number, y: number, color: Color) => void;
  setOneOppositeColor: (x: number, y: number, color: Color) => void;
}

export function modifyTiles(
  grid: GridData,
  mapper?: (x: number, y: number, methods: TileMethods) => void
) {
  const tiles = grid.tiles.map(row => row.map(tile => tile));
  if (!mapper) return tiles;
  const methods: TileMethods = {
    get: (x, y) => grid.tiles[y][x],
    setColor: (x, y, color) => setColor(grid, tiles, x, y, color),
    setOneColor: (x, y, color) => setOneColor(tiles, x, y, color),
    setOppositeColor: (x, y, color) =>
      setOppositeColor(grid, tiles, x, y, color),
    setOneOppositeColor: (x, y, color) =>
      setOneOppositeColor(tiles, x, y, color),
  };
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      mapper(x, y, methods);
    }
  }
  return tiles;
}

import GridData from '../../grid.js';
import { Color, Position } from '../../primitives.js';
import TileData from '../../tile.js';

export function cell(cell: Position): string {
  return `(${cell.x},${cell.y})`;
}

export function region(representative: Position): string {
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

interface TileMethods {
  get: (x: number, y: number) => TileData;
  setColor: (x: number, y: number, color: Color) => void;
  setOneColor: (x: number, y: number, color: Color) => void;
  setOppositeColor: (x: number, y: number, color: Color) => void;
  setOneOppositeColor: (x: number, y: number, color: Color) => void;
}

export function modifyTiles(
  grid: GridData,
  mapper: (x: number, y: number, methods: TileMethods) => void
) {
  const tiles = grid.tiles.map(row => row.map(tile => tile));
  const methods: TileMethods = {
    get: (x, y) => grid.tiles[y][x],
    setColor: (x, y, color) => setColor(grid, tiles, x, y, color),
    setOneColor: (x, y, color) => setOneColor(tiles, x, y, color),
    setOppositeColor: (x, y, color) =>
      setColor(
        grid,
        tiles,
        x,
        y,
        color === Color.Dark ? Color.Light : Color.Dark
      ),
    setOneOppositeColor: (x, y, color) =>
      setOneColor(tiles, x, y, color === Color.Dark ? Color.Light : Color.Dark),
  };
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      mapper(x, y, methods);
    }
  }
  return tiles;
}

import GridData from '../../grid.js';
import { Color, Position } from '../../primitives.js';
import TileData from '../../tile.js';
import Symbol from '../../symbols/symbol.js';

/** The distinct cells a symbol touches (one for integer positions, up to four for subtiles). */
export function symbolCorners(symbol: Symbol): Position[] {
  const xs = [Math.floor(symbol.x), Math.ceil(symbol.x)];
  const ys = [Math.floor(symbol.y), Math.ceil(symbol.y)];
  const corners: Position[] = [];
  for (const y of ys) {
    for (const x of xs) {
      const last = corners[corners.length - 1];
      if (!last || last.x !== x || last.y !== y) corners.push({ x, y });
    }
  }
  return corners;
}

export function cell(cell: Position | Position[]): string {
  let positions = Array.isArray(cell) ? cell : [cell];
  positions = positions.filter(
    (pos, index) =>
      positions.findIndex(p => p.x === pos.x && p.y === pos.y) === index
  );
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    if (pos.x % 1 !== 0 && pos.y % 1 !== 0) {
      positions.splice(
        i,
        1,
        { x: Math.floor(pos.x), y: Math.floor(pos.y) },
        { x: Math.floor(pos.x), y: Math.ceil(pos.y) },
        { x: Math.ceil(pos.x), y: Math.floor(pos.y) },
        { x: Math.ceil(pos.x), y: Math.ceil(pos.y) }
      );
    } else if (pos.x % 1 !== 0) {
      positions.splice(
        i,
        1,
        { x: Math.floor(pos.x), y: pos.y },
        { x: Math.ceil(pos.x), y: pos.y }
      );
    } else if (pos.y % 1 !== 0) {
      positions.splice(
        i,
        1,
        { x: pos.x, y: Math.floor(pos.y) },
        { x: pos.x, y: Math.ceil(pos.y) }
      );
    }
  }
  return `(${positions.map(c => `${c.x},${c.y}`).join(';')})`;
}

export function area(representative: Position | Position[]): string {
  if (Array.isArray(representative)) {
    return `[${representative.map(c => `${Math.floor(c.x)},${Math.floor(c.y)}`).join(';')}]`;
  }
  return `[${Math.floor(representative.x)},${Math.floor(representative.y)}]`;
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

import { Position } from '../../primitives.js';

export function cell(cell: Position): string {
  return `(${cell.x},${cell.y})`;
}

export function region(representative: Position): string {
  return `[${representative.x},${representative.y}]`;
}

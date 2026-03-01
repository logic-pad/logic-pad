import { Direction, Edge, Orientation, Position } from './primitives.js';

/**
 * Offset the given position by a given step in the given direction.
 * @param position The position to offset.
 * @param direction The direction to offset in.
 * @param step The distance to offset by.
 * @returns The offset position.
 */
export function move(
  position: Position,
  direction: Direction | Orientation,
  step = 1
) {
  switch (direction) {
    case Direction.Up:
    case Orientation.Up:
      return { x: position.x, y: position.y - step };
    case Direction.Down:
    case Orientation.Down:
      return { x: position.x, y: position.y + step };
    case Direction.Left:
    case Orientation.Left:
      return { x: position.x - step, y: position.y };
    case Direction.Right:
    case Orientation.Right:
      return { x: position.x + step, y: position.y };
    case Orientation.UpLeft:
      return { x: position.x - step, y: position.y - step };
    case Orientation.UpRight:
      return { x: position.x + step, y: position.y - step };
    case Orientation.DownLeft:
      return { x: position.x - step, y: position.y + step };
    case Orientation.DownRight:
      return { x: position.x + step, y: position.y + step };
  }
}

/**
 * Check if two edges are the same, regardless of direction.
 * @param a The first edge.
 * @param b The second edge.
 * @returns Whether the edges are the same.
 */
export function isSameEdge(a: Edge, b: Edge): boolean {
  return (
    (a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2) ||
    (a.x1 === b.x2 && a.y1 === b.y2 && a.x2 === b.x1 && a.y2 === b.y1)
  );
}

/**
 * Convert the given direction to a rotation in degrees.
 * @param direction The direction to convert.
 * @returns The rotation in degrees.
 */
export function directionToRotation(direction: Direction) {
  switch (direction) {
    case Direction.Up:
      return 0;
    case Direction.Left:
      return 270;
    case Direction.Right:
      return 90;
    case Direction.Down:
      return 180;
  }
}

/**
 * Convert the given orientation to a rotation in degrees.
 * @param orientation The orientation to convert.
 * @returns The rotation in degrees.
 */
export function orientationToRotation(orientation: Orientation) {
  switch (orientation) {
    case Orientation.Up:
      return 0;
    case Orientation.Left:
      return 270;
    case Orientation.Right:
      return 90;
    case Orientation.Down:
      return 180;
    case Orientation.DownLeft:
      return 225;
    case Orientation.DownRight:
      return 125;
    case Orientation.UpLeft:
      return 315;
    case Orientation.UpRight:
      return 45;
  }
}

/**
 * Create a new 2D array with the given dimensions and values.
 * @param width The width of the array.
 * @param height The height of the array.
 * @param value A function that returns the value for each x,y coordinate.
 * @returns The 2D array.
 */
export function array<T>(
  width: number,
  height: number,
  value: (x: number, y: number) => T
): T[][] {
  const result: T[][] = [];

  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      result[y][x] = value(x, y);
    }
  }

  return result;
}

/**
 * Resize the given array to the new size, cutting off or padding with the default value.
 * @param array The array to resize.
 * @param newSize The new size of the array.
 * @param defaultValue A function that returns the default value for each new element.
 * @returns The resized array.
 */
export function resize<T>(
  array: T[],
  newSize: number,
  defaultValue: () => T
): T[];
export function resize<T>(
  array: readonly T[],
  newSize: number,
  defaultValue: () => T
): readonly T[];
export function resize<T>(
  array: readonly T[],
  newSize: number,
  defaultValue: () => T
): readonly T[] {
  if (array.length < newSize) {
    return [
      ...array,
      ...Array.from({ length: newSize - array.length }, defaultValue),
    ];
  } else if (array.length > newSize) {
    return array.slice(0, newSize);
  }
  return array;
}

/**
 * Check if all the given values are equal.
 * @param values The values to compare.
 * @returns Whether all the values are equal.
 */
export function allEqual<T>(...values: T[]) {
  return values.every(value => value === values[0]);
}

/**
 * Return the first element of the array which has the minimum mapped value.
 *
 * @param values The array of values.
 * @param mapper The function to map each value to a number.
 * @returns The first element with the minimum mapped value.
 */
export function minBy<T>(values: readonly T[], mapper: (element: T) => number) {
  let min = Number.POSITIVE_INFINITY;
  let result: T | undefined;
  for (const value of values) {
    const mapped = mapper(value);
    if (mapped < min) {
      min = mapped;
      result = value;
    }
  }
  return result;
}

/**
 * Return the first element of the array which has the maximum mapped value.
 *
 * @param values The array of values.
 * @param mapper The function to map each value to a number.
 * @returns The first element with the maximum mapped value.
 */
export function maxBy<T>(values: readonly T[], mapper: (element: T) => number) {
  let max = Number.NEGATIVE_INFINITY;
  let result: T | undefined;
  for (const value of values) {
    const mapped = mapper(value);
    if (mapped > max) {
      max = mapped;
      result = value;
    }
  }
  return result;
}

/**
 * Escape the given text by replacing the specified characters with HTML escape sequences.
 * @param text The text to escape.
 * @param escapeCharacters The characters to escape.
 * @returns The escaped text.
 */
export function escape(text: string, escapeCharacters = '=,:|') {
  let result = '';
  for (const char of text) {
    if (escapeCharacters.includes(char) || char === '&') {
      result += `&#${char.charCodeAt(0)};`;
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Unescape the given text by replacing HTML escape sequences with the corresponding characters.
 * @param text The text to unescape.
 * @param escapeCharacters The characters to unescape. This should match the characters escaped by the `escape` function.
 * @returns The unescaped text.
 */
export function unescape(text: string, escapeCharacters = '=,:|') {
  let result = '';
  const matches = text.matchAll(/&#([0-9]+);/g);
  let index = 0;
  for (const match of matches) {
    result += text.substring(index, match.index);
    const char = String.fromCharCode(parseInt(match[1], 10));
    if (escapeCharacters.includes(char) || char === '&') {
      result += char;
    } else {
      result += match[0];
    }
    index = match.index + match[0].length;
  }
  return result + text.substring(index);
}

export class CachedAccess<T> {
  private static readonly UNCACHED = Symbol('uncached');

  private cache: T | typeof CachedAccess.UNCACHED = CachedAccess.UNCACHED;

  private constructor(private readonly getter: () => T) {}

  public static of<T>(getter: () => T) {
    return new CachedAccess(getter);
  }

  public get value() {
    if (this.cache === CachedAccess.UNCACHED) {
      this.cache = this.getter();
    }
    return this.cache;
  }
}

import GridData from '../grid.js';
import { Puzzle, PuzzleData } from '../puzzle.js';
import Rule from '../rules/rule.js';
import Symbol from '../symbols/symbol.js';
import TileData from '../tile.js';
import SerializerV0 from './serializer_v0.js';
import SerializerBase from './serializerBase.js';

const allSerializers = new Map<number, SerializerBase>();

function register(prototype: SerializerBase) {
  allSerializers.set(prototype.version, prototype);
}

let defaultSerializer: SerializerBase;

register((defaultSerializer = new SerializerV0()));

function selectSerializer(input: string): {
  serializer: SerializerBase;
  data: string;
} {
  const match = /^(\d+)_/.exec(input);
  const version = match ? parseInt(match[1]) : 0;
  const serializer = allSerializers.get(version);
  if (serializer) {
    return { serializer, data: input.slice(match?.[0].length ?? 0) };
  } else {
    throw new Error(`Unknown serializer version for ${input}`);
  }
}

/**
 * The master serializer for puzzles.
 *
 * It uses the default serializer when stringifying puzzles, and select the correct deserializer when parsing puzzles.
 */
const Serializer = {
  stringifyTiles(tiles: readonly (readonly TileData[])[]): string {
    return `${defaultSerializer.version}_${defaultSerializer.stringifyTiles(tiles)}`;
  },
  parseTiles(input: string): TileData[][] {
    const { serializer, data } = selectSerializer(input);
    return serializer.parseTiles(data);
  },
  stringifyRule(rule: Rule): string {
    return `${defaultSerializer.version}_${defaultSerializer.stringifyRule(rule)}`;
  },
  parseRule(input: string): Rule {
    const { serializer, data } = selectSerializer(input);
    return serializer.parseRule(data);
  },
  stringifySymbol(symbol: Symbol): string {
    return `${defaultSerializer.version}_${defaultSerializer.stringifySymbol(symbol)}`;
  },
  parseSymbol(input: string): Symbol {
    const { serializer, data } = selectSerializer(input);
    return serializer.parseSymbol(data);
  },
  stringifyGrid(grid: GridData): string {
    return `${defaultSerializer.version}_${defaultSerializer.stringifyGrid(grid)}`;
  },
  parseGrid(input: string): GridData {
    const { serializer, data } = selectSerializer(input);
    return serializer.parseGrid(data);
  },
  stringifyGridWithSolution(puzzle: PuzzleData): string {
    return `${defaultSerializer.version}_${defaultSerializer.stringifyGridWithSolution(puzzle)}`;
  },
  parseGridWithSolution(input: string): PuzzleData {
    const { serializer, data } = selectSerializer(input);
    return serializer.parseGridWithSolution(data);
  },
  /**
   * Convert a puzzle to a string.
   * @param puzzle The puzzle to convert.
   * @returns The string representation of the puzzle.
   */
  stringifyPuzzle(puzzle: Puzzle): string {
    return `${defaultSerializer.version}_${defaultSerializer.stringifyPuzzle(puzzle)}`;
  },
  /**
   * Parse a puzzle from a string.
   * @param input The string to parse.
   * @returns The parsed puzzle.
   */
  parsePuzzle(input: string): Puzzle {
    const { serializer, data } = selectSerializer(input);
    return serializer.parsePuzzle(data);
  },
};

export { Serializer };

import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { array } from '../dataHelper.js';
import { Color, State } from '../primitives.js';
import Symbol from './symbol.js';

export default class EveryLetterSymbol extends Symbol {
  public readonly title = 'Hollow Letter';

  private static readonly CONFIGS: readonly AnyConfig[] = Object.freeze([
    {
      type: ConfigType.Number,
      default: 0,
      field: 'x',
      description: 'X',
      configurable: false,
    },
    {
      type: ConfigType.Number,
      default: 0,
      field: 'y',
      description: 'Y',
      configurable: false,
    },
    {
      type: ConfigType.String,
      default: 'a',
      field: 'letter',
      description: 'Letter',
      explanation: 'Use single lowercase letters by convention.',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['bwwbw', 'bwbbw', 'wwbww', 'bbbwb'])
      .addSymbol(new EveryLetterSymbol(2, 0, 'b'))
      .addSymbol(new EveryLetterSymbol(4, 1, 'a'))
      .addSymbol(new EveryLetterSymbol(0, 2, 'a'))
      .addSymbol(new EveryLetterSymbol(3, 2, 'b'))
  );

  /**
   * **Include each Hollow Letter once per region**
   *
   * @param x - The x-coordinate of the symbol.
   * @param y - The y-coordinate of the symbol.
   * @param letter - The letter of the symbol.
   */
  public constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly letter: string
  ) {
    super(x, y);
    this.letter = letter;
  }

  public get id(): string {
    return `every_letter`;
  }

  public get explanation(): string {
    return 'Include each *Hollow Letter* once per region';
  }

  public get configs(): readonly AnyConfig[] | null {
    return EveryLetterSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return EveryLetterSymbol.EXAMPLE_GRID;
  }

  public validateSymbol(grid: GridData): State {
    if (!this.validateSubtilePlacement(grid)) return State.Error;

    const uniqueLetters = new Set(
      grid.symbols.get(this.id)?.map(s => (s as EveryLetterSymbol).letter)
    );
    if (uniqueLetters.size === 0) {
      return State.Satisfied;
    }
    const possibleLetters = new Set(uniqueLetters);
    const thisX = Math.floor(this.x);
    const thisY = Math.floor(this.y);
    let complete = true;
    const visited = array(grid.width, grid.height, () => false);
    const connected = array(grid.width, grid.height, () => false);
    const color = grid.getTile(thisX, thisY).color;
    if (color !== Color.Gray) {
      grid.iterateArea(
        { x: thisX, y: thisY },
        tile => tile.color === Color.Gray || tile.color === color,
        (tile, x, y) => {
          visited[y][x] = true;
          if (tile.color === Color.Gray) complete = false;
        }
      );
      grid.iterateArea(
        { x: thisX, y: thisY },
        tile => tile.color === color,
        (_, x, y) => {
          connected[y][x] = true;
        }
      );
    } else {
      return State.Incomplete;
    }
    for (const symbol of grid.symbols.get(this.id) ?? []) {
      if (symbol instanceof EveryLetterSymbol) {
        const symbolX = Math.floor(symbol.x);
        const symbolY = Math.floor(symbol.y);
        if (visited[symbolY][symbolX]) {
          possibleLetters.delete(symbol.letter);
        }
        if (connected[symbolY][symbolX]) {
          if (!uniqueLetters.delete(symbol.letter)) {
            return State.Error;
          }
        }
      }
    }
    if (possibleLetters.size > 0) {
      return State.Error;
    }
    return complete ? State.Satisfied : State.Incomplete;
  }

  public copyWith({
    x,
    y,
    letter,
  }: {
    x?: number;
    y?: number;
    letter?: string;
  }): this {
    return new EveryLetterSymbol(
      x ?? this.x,
      y ?? this.y,
      letter ?? this.letter
    ) as this;
  }

  public withLetter(letter: string): this {
    return this.copyWith({ letter });
  }
}

export const instance = new EveryLetterSymbol(0, 0, 'a');

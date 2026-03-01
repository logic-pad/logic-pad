import { AnyConfig, ConfigType } from '../config.js';
import GridData from '../grid.js';
import { array } from '../dataHelper.js';
import { Color, State } from '../primitives.js';
import Symbol from './symbol.js';

export default class LetterSymbol extends Symbol {
  public readonly title = 'Letter';

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
      default: 'A',
      field: 'letter',
      description: 'Letter',
      explanation: 'Use single uppercase letters by convention.',
      configurable: true,
    },
  ]);

  private static readonly EXAMPLE_GRID = Object.freeze(
    GridData.create(['bbbww', 'wwbbw', 'wwbbb', 'bwwww'])
      .addSymbol(new LetterSymbol(0, 0, 'B'))
      .addSymbol(new LetterSymbol(3, 0, 'A'))
      .addSymbol(new LetterSymbol(4, 1, 'A'))
      .addSymbol(new LetterSymbol(3, 2, 'B'))
      .addSymbol(new LetterSymbol(1, 1, 'C'))
      .addSymbol(new LetterSymbol(0, 2, 'C'))
      .addSymbol(new LetterSymbol(4, 3, 'C'))
  );

  /**
   * **Letters must be sorted into one type per area**
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
    return `letter`;
  }

  public get explanation(): string {
    return '*Letters* must be sorted into one type per area';
  }

  public get configs(): readonly AnyConfig[] | null {
    return LetterSymbol.CONFIGS;
  }

  public createExampleGrid(): GridData {
    return LetterSymbol.EXAMPLE_GRID;
  }

  public validateSymbol(grid: GridData): State {
    if (!this.validateSubtilePlacement(grid)) return State.Error;

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
      complete = false;
    }
    for (const symbol of grid.symbols.get(this.id) ?? []) {
      if (symbol !== this && symbol instanceof LetterSymbol) {
        const symbolX = Math.floor(symbol.x);
        const symbolY = Math.floor(symbol.y);
        if (symbol.letter === this.letter) {
          const theirColor = grid.getTile(symbolX, symbolY).color;
          if (
            (color !== Color.Gray && !visited[symbolY][symbolX]) ||
            (color !== Color.Gray &&
              theirColor !== Color.Gray &&
              theirColor !== color)
          ) {
            return State.Error;
          }
        } else if (color !== Color.Gray && connected[symbolY][symbolX]) {
          return State.Error;
        }
      }
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
    return new LetterSymbol(
      x ?? this.x,
      y ?? this.y,
      letter ?? this.letter
    ) as this;
  }

  public withLetter(letter: string): this {
    return this.copyWith({ letter });
  }
}

export const instance = new LetterSymbol(0, 0, 'A');

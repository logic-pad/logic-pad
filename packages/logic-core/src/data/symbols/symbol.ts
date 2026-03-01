import { GridResizeHandler } from '../events/onGridResize.js';
import GridData from '../grid.js';
import Instruction from '../instruction.js';
import { Color, Mode, State } from '../primitives.js';

export default abstract class Symbol
  extends Instruction
  implements GridResizeHandler
{
  public constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    super();
    this.x = x;
    this.y = y;
  }

  public abstract validateSymbol(
    grid: GridData,
    solution: GridData | null
  ): State;

  public modeVariant(_mode: Mode): Symbol | null {
    return this as Symbol;
  }

  public onGridResize(
    _grid: GridData,
    mode: 'insert' | 'remove',
    direction: 'row' | 'column',
    index: number
  ): this | null {
    if (mode === 'insert') {
      return this.copyWith({
        x: direction === 'column' && this.x >= index ? this.x + 1 : this.x,
        y: direction === 'row' && this.y >= index ? this.y + 1 : this.y,
      });
    } else {
      if (direction === 'column' && this.x === index) return null;
      if (direction === 'row' && this.y === index) return null;
      return this.copyWith({
        x: direction === 'column' && this.x > index ? this.x - 1 : this.x,
        y: direction === 'row' && this.y > index ? this.y - 1 : this.y,
      });
    }
  }

  /**
   * The step size for the x and y coordinates of the symbol.
   */
  public get placementStep(): number {
    return 0.5;
  }

  /**
   * The order in which symbols are displayed on the instruction list. Lower values are displayed first.
   */
  public get sortOrder(): number {
    return this.id.charCodeAt(0);
  }

  public withX(x: number): this {
    return this.copyWith({ x });
  }

  public withY(y: number): this {
    return this.copyWith({ y });
  }

  public withPosition(x: number, y: number): this {
    return this.copyWith({ x, y });
  }

  /**
   * For symbols that can be placed between tiles, this method implements the default validation logic,
   * which requires all tiles touching the symbol to be either gray or of the same color.
   */
  protected validateSubtilePlacement(grid: GridData) {
    if (this.placementStep >= 1) return true;
    const minX = Math.floor(this.x);
    const minY = Math.floor(this.y);
    if (minX === this.x && minY === this.y) return true;
    const maxX = Math.ceil(this.x);
    const maxY = Math.ceil(this.y);
    let color = Color.Gray;
    for (let i = 0; i < 4; i++) {
      const x = i % 2 === 0 ? minX : maxX;
      const y = i < 2 ? minY : maxY;
      const tile = grid.getTile(x, y);
      if (!tile.exists) return false;
      if (tile.color !== Color.Gray) {
        if (color === Color.Gray) {
          color = tile.color;
        } else if (color !== tile.color) {
          return false;
        }
      }
    }
    return true;
  }
}

export const instance = undefined;

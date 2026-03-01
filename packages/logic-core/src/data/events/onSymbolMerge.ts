import Instruction from '../instruction.js';
import Symbol from '../symbols/symbol.js';
import { isEventHandler } from './eventHelper.js';

export interface SymbolMergeHandler {
  /**
   * Determines if the description of two symbols can be merged when displayed in the UI.
   * @param other The other symbol to compare against.
   */
  descriptionEquals(other: Symbol): boolean;
}

export function handlesSymbolMerge<T extends Instruction>(
  val: T
): val is T & SymbolMergeHandler {
  return isEventHandler(val, 'descriptionEquals');
}

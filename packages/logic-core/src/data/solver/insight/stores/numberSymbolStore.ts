import OffByXRule, {
  instance as offByXInstance,
} from '../../../rules/offByXRule.js';
import NumberSymbol from '../../../symbols/numberSymbol.js';
import Proof from '../types/proof.js';
import InsightStore from './insightStore.js';
import type InsightContext from '../insightContext.js';

declare const numberSymbol: unique symbol;

export type SymbolTag = string & { [numberSymbol]: 'tag' };

export interface NumberSymbolData {
  possibilities: number[];
  readonly deductions: Map<number, Proof>;
}

/**
 * Tracks true-number possibilities for number symbols.
 */
export default class NumberSymbolStore extends InsightStore {
  private symbols = new Map<SymbolTag, NumberSymbolData>();
  private offByX: OffByXRule | undefined;

  public readonly id = 'number-symbol';

  public constructor(context: InsightContext, initialize = true) {
    super(context);
    this.offByX = this.context.grid.rules.find(
      (rule): rule is OffByXRule => rule.id === offByXInstance.id
    );
    if (initialize) {
      this.initialize();
    }
  }

  private initialize(): void {
    const grid = this.context.grid;

    for (const [id, list] of grid.symbols.entries()) {
      list.forEach((symbol, index) => {
        if (!(symbol instanceof NumberSymbol)) return;

        const tag = this.getTag(id, index);

        if (!this.offByX) {
          this.symbols.set(tag, {
            possibilities: [symbol.number],
            deductions: new Map<number, Proof>(),
          });
          return;
        }

        const possibilities: number[] = [];
        if (symbol.number - this.offByX.number > 0) {
          possibilities.push(symbol.number - this.offByX.number);
        }
        if (symbol.number + this.offByX.number <= grid.width * grid.height) {
          possibilities.push(symbol.number + this.offByX.number);
        }
        this.symbols.set(tag, {
          possibilities,
          deductions: new Map<number, Proof>(),
        });
      });
    }
  }

  public onGridUpdate(): void {
    // Number-symbol deductions are independent of cell color updates.
  }

  public copyWithContext(context: InsightContext): this {
    const copy = new NumberSymbolStore(context, false) as this;
    copy.offByX = this.offByX;
    for (const [tag, data] of this.symbols.entries()) {
      copy.symbols.set(tag, {
        possibilities: [...data.possibilities],
        deductions: new Map<number, Proof>(data.deductions),
      });
    }
    return copy;
  }

  public getPossibilities(tag: SymbolTag): number[] {
    const data = this.symbols.get(tag);
    if (!data) {
      throw this.error('Symbol not found: ' + tag);
    }
    return data.possibilities;
  }

  /**
   * Returns minimum possible true value and contributes supporting proof.
   */
  public minPossible(tag: SymbolTag, proof?: Proof): number {
    const data = this.symbols.get(tag);
    if (!data) {
      throw this.error('Symbol not found: ' + tag);
    }
    if (data.possibilities.length === 0) {
      throw this.error('No possibilities remain for symbol: ' + tag);
    }

    const minimum = Math.min(...data.possibilities);

    for (const [possibility, deduction] of data.deductions.entries()) {
      if (possibility >= minimum) continue;
      proof?.add(deduction);
    }

    return minimum;
  }

  /**
   * Returns maximum possible true value and contributes supporting proof.
   */
  public maxPossible(tag: SymbolTag, proof?: Proof): number {
    const data = this.symbols.get(tag);
    if (!data) {
      throw this.error('Symbol not found: ' + tag);
    }
    if (data.possibilities.length === 0) {
      throw this.error('No possibilities remain for symbol: ' + tag);
    }

    const maximum = Math.max(...data.possibilities);

    for (const [possibility, deduction] of data.deductions.entries()) {
      if (possibility <= maximum) continue;
      proof?.add(deduction);
    }

    return maximum;
  }

  /**
   * Eliminates one possible true value for a symbol. Returns true if the possibility was successfully eliminated.
   */
  public eliminatePossibility(
    tag: SymbolTag,
    possibility: number,
    deduction: Proof
  ): boolean {
    const data = this.symbols.get(tag);
    if (!data) return false;

    if (!data.possibilities.includes(possibility)) return false;

    data.possibilities = data.possibilities.filter(
      value => value !== possibility
    );
    data.deductions.set(possibility, deduction);
    return true;
  }

  /**
   * Creates the canonical symbol tag "id,index".
   */
  public getTag(id: string, index: number): SymbolTag {
    return `${id},${index}` as SymbolTag;
  }
}

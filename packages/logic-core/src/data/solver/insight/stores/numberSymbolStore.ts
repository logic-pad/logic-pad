import OffByXRule, {
  instance as offByXInstance,
} from '../../../rules/offByXRule.js';
import NumberSymbol from '../../../symbols/numberSymbol.js';
import { cell } from '../helper.js';
import Proof from '../types/proof.js';
import InsightStore from './insightStore.js';
import type InsightContext from '../insightContext.js';

/**
 * Tracks the possible values of each number symbol along with the proofs that eliminated specific
 * values.
 *
 * Without an off-by-X rule a symbol admits exactly its printed number, so the store mainly serves
 * as a place to record eliminations. With one, every symbol admits `n - x` and `n + x`, and lemmas
 * eliminate the candidates their counting rules cannot satisfy.
 *
 * Base candidates are derived on demand from the current grid, so they follow the printed number;
 * eliminations are recorded against the symbol object itself, whose identity is stable across grid
 * updates (only tiles change during a solve).
 *
 * Feasibility against a symbol's own count (what it has already seen versus what it could still
 * see) is deliberately left to the lemmas: they own the counting rules and therefore produce the
 * precise contradiction messages. Callers eliminate values through
 * {@link NumberSymbolStore.eliminatePossibility}.
 */
export default class NumberSymbolStore extends InsightStore {
  private eliminations = new Map<NumberSymbol, Map<number, Proof>>();
  private offByX: OffByXRule | undefined;

  public readonly id = 'number-symbol';

  public constructor(context: InsightContext) {
    super(context);
    this.offByX = this.context.grid.rules.find(
      (rule): rule is OffByXRule => rule.id === offByXInstance.id
    );
  }

  public onGridUpdate(): void {
    // Candidates are derived on demand from the current grid, so there is nothing to update.
  }

  public copyWithContext(context: InsightContext): this {
    const copy = new NumberSymbolStore(context) as this;
    for (const [symbol, deductions] of this.eliminations.entries()) {
      copy.eliminations.set(symbol, new Map<number, Proof>(deductions));
    }
    return copy;
  }

  /**
   * Returns the values the given number symbol could still hold, or null if it has no printed
   * number to constrain.
   *
   * When a proof is given, the deductions that eliminated other values for this symbol are added
   * to it as supporting evidence.
   */
  public getPossibilities(
    symbol: NumberSymbol,
    proof?: Proof
  ): number[] | null {
    const base = this.basePossibilities(symbol);
    const deductions = this.eliminations.get(symbol);
    if (proof && deductions) {
      for (const [value, deduction] of deductions.entries()) {
        if (base.includes(value)) proof.add(deduction);
      }
    }
    return deductions ? base.filter(value => !deductions.has(value)) : base;
  }

  /**
   * Returns the smallest value the symbol could still hold and contributes supporting proof.
   */
  public minPossible(symbol: NumberSymbol, proof?: Proof): number {
    const possibilities = this.getPossibilities(symbol, proof);
    if (possibilities === null) {
      throw this.error(
        `Number symbol at ${cell(symbol)} has no value constraint`
      );
    }
    if (possibilities.length === 0) {
      throw this.error(
        `No possible values remain for the number symbol at ${cell(symbol)}`
      );
    }
    return Math.min(...possibilities);
  }

  /**
   * Returns the largest value the symbol could still hold and contributes supporting proof.
   */
  public maxPossible(symbol: NumberSymbol, proof?: Proof): number {
    const possibilities = this.getPossibilities(symbol, proof);
    if (possibilities === null) {
      throw this.error(
        `Number symbol at ${cell(symbol)} has no value constraint`
      );
    }
    if (possibilities.length === 0) {
      throw this.error(
        `No possible values remain for the number symbol at ${cell(symbol)}`
      );
    }
    return Math.max(...possibilities);
  }

  /**
   * Eliminates one possible value of a number symbol. Returns true if the value was successfully
   * eliminated.
   */
  public eliminatePossibility(
    symbol: NumberSymbol,
    possibility: number,
    deduction: Proof
  ): boolean {
    const possibilities = this.getPossibilities(symbol);
    if (!possibilities || !possibilities.includes(possibility)) return false;

    let deductions = this.eliminations.get(symbol);
    if (!deductions) {
      deductions = new Map<number, Proof>();
      this.eliminations.set(symbol, deductions);
    }
    if (deductions.has(possibility)) return false;
    deductions.set(possibility, deduction);
    return true;
  }

  /**
   * The values the printed number admits before any elimination: exactly the number, or the two
   * numbers `n ± x` when an off-by-X rule is present, clamped to a range a count can physically
   * reach.
   */
  private basePossibilities(symbol: NumberSymbol): number[] {
    const number = symbol.number;
    if (!this.offByX) return [number];
    const maxCount = this.context.grid.getTileCount(true);
    const candidates: number[] = [];
    if (number - this.offByX.number >= 0)
      candidates.push(number - this.offByX.number);
    if (number + this.offByX.number <= maxCount)
      candidates.push(number + this.offByX.number);
    return candidates;
  }
}

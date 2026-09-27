import OffByXRule, {
  instance as offByXInstance,
} from '../../../rules/offByXRule.js';
import AreaNumberSymbol from '../../../symbols/areaNumberSymbol.js';
import { area } from '../helper.js';
import Proof from '../types/proof.js';
import InsightStore from './insightStore.js';
import type InsightContext from '../insightContext.js';
import { Region, RegionId } from './regionStore.js';

/**
 * Tracks the possible sizes of regions based on the area number symbols they contain, along with
 * the proofs that eliminated specific sizes.
 *
 * Base possibilities are derived on demand from the area number symbols currently in each region
 * (including both `n±x` values when an off-by-X rule is present), so they automatically follow
 * region merges and grid updates. Eliminations are recorded against the region's ID at the time
 * of the deduction and are re-resolved through the region store on every query, so they propagate
 * to any region that later absorbs the tracked cells.
 */
export default class RegionSizeStore extends InsightStore {
  private eliminations = new Map<RegionId, Map<number, Proof>>();
  private offByX: OffByXRule | undefined;

  public readonly id = 'region-size';

  public constructor(context: InsightContext) {
    super(context);
    this.offByX = this.context.grid.rules.find(
      (rule): rule is OffByXRule => rule.id === offByXInstance.id
    );
  }

  public onGridUpdate(): void {
    // Possibilities are derived on demand from the current regions, so there is nothing to update.
  }

  public copyWithContext(context: InsightContext): this {
    const copy = new RegionSizeStore(context) as this;
    for (const [regionId, deductions] of this.eliminations.entries()) {
      copy.eliminations.set(regionId, new Map<number, Proof>(deductions));
    }
    return copy;
  }

  /**
   * Returns the possible sizes of the given region, or null if the region's size is not
   * constrained by any area number symbol.
   *
   * When a proof is given, all deductions that eliminated other sizes for this region are added
   * to it as supporting evidence.
   */
  public getPossibilities(region: Region, proof?: Proof): number[] | null {
    const base = this.basePossibilities(region);
    if (!base) return null;
    const deductions = this.collectDeductions(region);
    if (proof) {
      for (const [possibility, deduction] of deductions.entries()) {
        if (base.includes(possibility)) proof.add(deduction);
      }
    }
    return base.filter(value => !deductions.has(value));
  }

  /**
   * Returns the minimum possible size of the region and contributes supporting proof.
   */
  public minPossible(region: Region, proof?: Proof): number {
    const possibilities = this.getPossibilities(region);
    if (!possibilities) {
      throw this.error(
        `Region ${area(region.positions[0])} has no size constraint`
      );
    }
    if (possibilities.length === 0) {
      throw this.error(
        `No possible sizes remain for region ${area(region.positions[0])}`
      );
    }

    const minimum = Math.min(...possibilities);

    for (const [possibility, deduction] of this.collectDeductions(region)) {
      if (possibility >= minimum) continue;
      proof?.add(deduction);
    }

    return minimum;
  }

  /**
   * Returns the maximum possible size of the region and contributes supporting proof.
   */
  public maxPossible(region: Region, proof?: Proof): number {
    const possibilities = this.getPossibilities(region);
    if (!possibilities) {
      throw this.error(
        `Region ${area(region.positions[0])} has no size constraint`
      );
    }
    if (possibilities.length === 0) {
      throw this.error(
        `No possible sizes remain for region ${area(region.positions[0])}`
      );
    }

    const maximum = Math.max(...possibilities);

    for (const [possibility, deduction] of this.collectDeductions(region)) {
      if (possibility <= maximum) continue;
      proof?.add(deduction);
    }

    return maximum;
  }

  /**
   * Eliminates one possible size for a region. Returns true if the possibility was successfully
   * eliminated.
   *
   * The elimination follows the tracked cells: if their region is later merged into a larger one,
   * the larger region inherits the elimination.
   */
  public eliminatePossibility(
    region: Region,
    possibility: number,
    deduction: Proof
  ): boolean {
    const possibilities = this.getPossibilities(region);
    if (possibilities && !possibilities.includes(possibility)) return false;

    let deductions = this.eliminations.get(region.id);
    if (!deductions) {
      deductions = new Map<number, Proof>();
      this.eliminations.set(region.id, deductions);
    }
    if (deductions.has(possibility)) return false;
    deductions.set(possibility, deduction);
    return true;
  }

  /**
   * Computes the base possible sizes of a region from the area number symbols it contains, or
   * null if the region contains no area number symbol.
   */
  private basePossibilities(region: Region): number[] | null {
    const grid = this.context.grid;
    const size = grid.width * grid.height;
    let possibilities: number[] | null = null;
    for (const symbol of region.symbols) {
      if (!(symbol instanceof AreaNumberSymbol)) continue;
      const symbolPossibilities: number[] = [];
      if (!this.offByX) {
        symbolPossibilities.push(symbol.number);
      } else {
        if (symbol.number - this.offByX.number > 0) {
          symbolPossibilities.push(symbol.number - this.offByX.number);
        }
        if (symbol.number + this.offByX.number <= size) {
          symbolPossibilities.push(symbol.number + this.offByX.number);
        }
      }
      possibilities =
        possibilities === null
          ? symbolPossibilities
          : possibilities.filter(value => symbolPossibilities.includes(value));
    }
    return possibilities;
  }

  /**
   * Collects all eliminations recorded against regions whose cells are now part of the given region.
   */
  private collectDeductions(region: Region): Map<number, Proof> {
    const collected = new Map<number, Proof>();
    for (const [regionId, deductions] of this.eliminations.entries()) {
      if (regionId !== region.id) {
        const resolved = this.context.regions.get(regionId);
        if (!resolved || resolved.id !== region.id) continue;
      }
      for (const [possibility, deduction] of deductions.entries()) {
        if (!collected.has(possibility)) collected.set(possibility, deduction);
      }
    }
    return collected;
  }
}

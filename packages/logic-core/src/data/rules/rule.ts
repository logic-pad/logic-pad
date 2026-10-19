import GridData from '../grid.js';
import { Mode, RuleState } from '../primitives.js';
import Instruction from '../instruction.js';

export interface SearchVariant {
  /**
   * Human readable, translated description
   */
  readonly description: string;
  readonly rule: Rule;
}

/**
 * Build a search variant whose description is read on demand to enable locale changing
 */
function searchVariantOf(rule: Rule): SearchVariant {
  return {
    get description(): string {
      return rule.explanation;
    },
    rule,
  };
}

export default abstract class Rule extends Instruction {
  public abstract validateGrid(grid: GridData): RuleState;

  public abstract get searchVariants(): SearchVariant[];

  public searchVariant(): SearchVariant {
    return searchVariantOf(this);
  }

  public modeVariant(_mode: Mode): Rule | null {
    return this as Rule;
  }

  /**
   * Whether only one instance of this rule is allowed in a grid.
   */
  public get isSingleton(): boolean {
    return false;
  }
}

export const instance = undefined;

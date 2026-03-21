import type InsightContext from '../insightContext.js';
import InsightError from '../types/insightError.js';

/**
 * Base class for all insight context stores.
 */
export default abstract class InsightStore {
  protected constructor(protected readonly context: InsightContext) {}

  public abstract get id(): string;

  /**
   * Refresh internal deductions after the context grid colors changed.
   */
  public abstract onGridUpdate(): void;

  public abstract copyWithContext(context: InsightContext): this;

  protected error(message: string): InsightError {
    return new InsightError(this.id, message);
  }
}

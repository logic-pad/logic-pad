import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightError from '../types/insightError.js';
import Proof from '../types/proof.js';

export default abstract class InsightLemma {
  public abstract get id(): string;

  public abstract isApplicable(grid: GridData): boolean;

  public abstract apply(context: InsightContext): boolean;

  protected proof(): Proof {
    return Proof.create(this.id);
  }

  protected error(message: string): InsightError {
    return new InsightError(this.id, message);
  }
}

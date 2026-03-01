import GridData from '../../grid.js';

export type RequirementFunction = (grid: GridData) => boolean;

export type ApplyFunction = (grid: GridData) => [boolean, GridData];

export abstract class Lemma {
  public abstract get id(): string;
  public abstract get score(): number;

  public abstract apply(grid: GridData): [boolean, GridData];
  public abstract isApplicable(grid: GridData): boolean;

  protected static basicRequirements(
    grid: GridData,
    requirements: {
      instructionId: string;
      presence: boolean;
    }[]
  ): boolean {
    return requirements.every(req => {
      return (
        !(
          grid.findRule(rule => rule.id === req.instructionId) ??
          grid.findSymbol(symbol => symbol.id === req.instructionId)
        ) !== req.presence
      );
    });
  }
}

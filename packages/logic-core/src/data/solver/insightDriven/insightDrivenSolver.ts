import EventIteratingSolver from '../eventIteratingSolver.js';

export default class InsightDrivenSolver extends EventIteratingSolver {
  public readonly id = 'insightDriven';

  public readonly author = 'romain22222';

  public readonly description =
    'An insight-driven solver that support restricted rules and symbols. Also gives a difficulty rating.';

  public isInstructionSupported(/* instructionId: string */): boolean {
    // TODO -> for the moment, there is so few lemmas that it's meaningless to check if a specific instruction is supported
    return true;
    /* if (super.isInstructionSupported(instructionId)) {
      return true;
    }
    return instructionId === undercluedInstance.id; */
  }

  protected createWorker(): Worker {
    return new Worker(new URL('./insightDrivenWorker.js', import.meta.url), {
      type: 'module',
    });
  }
}

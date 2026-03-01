import { CachedAccess } from '../dataHelper.js';
import GridData from '../grid.js';
import { allRules } from '../rules/index.js';
import { allSymbols } from '../symbols/index.js';
import { Instruction } from '../../index.js';
import { instance as undercluedInstance } from '../rules/undercluedRule.js';

/**
 * Base class that all solvers must extend.
 */
export default abstract class Solver {
  /**
   * The unique identifier of the solver.
   *
   * This is also displayed to the user when selecting a solver.
   */
  public abstract get id(): string;

  /**
   * The author(s) of the solver.
   */
  public abstract get author(): string;

  /**
   * A short paragraph describing when the user should use this solver.
   */
  public abstract get description(): string;

  /**
   * Whether the solver supports cancellation. If `true`, the solver must respond to the abort signal if it is provided.
   */
  public abstract get supportsCancellation(): boolean;

  /**
   * Solve the given grid. The implementation should delegate long-running tasks to a worker thread and yield solutions
   * asynchronously.
   *
   * The solver must yield at least once, otherwise the UI will not update.
   *
   * If the solver finds no solution other than those already yielded, it should yield `null`. Yielding `null` on the
   * first iteration indicates that the grid is unsolvable. Yielding `null` on the second iteration indicates that the
   * solution is unique.
   *
   * If the solve finds the trivial solution of not filling any tiles, such as in the case of an underclued grid with
   * too many alternate solutions, it must yield the solution instead of yielding `null`.
   *
   * In the current UI implementation, the solver will be terminated after yielding `null`, or after 2 iterations if
   * `null` is never yielded. The solver should perform any necessary cleanup in the `finally` block of the generator.
   *
   * @param grid The grid to solve. The provided grid is guaranteed to be supported by the solver. Some tiles in the
   * grid may already be filled by the user. It is up to the solver to decide whether to respect these tiles or not.
   * @param abortSignal An optional signal that the solver should subscribe to in order to cancel the operation. If the
   * solver does not support cancellation, it should ignore this parameter.
   */
  public abstract solve(
    grid: GridData,
    abortSignal?: AbortSignal
  ): AsyncGenerator<GridData | null>;

  /**
   * Check if the solver supports the current browser environment. This method is called once when the user first clicks
   * the "Solve" button, and the result is cached for the duration of the editor session.
   *
   * The `solve` method will not be called if this method returns `false`, and a message will be displayed to the user
   * indicating that the solver is not supported.
   *
   * @returns A promise that resolves to `true` if the environment is supported, or `false` otherwise.
   */
  protected isEnvironmentSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public readonly environmentCheck = CachedAccess.of(() =>
    this.isEnvironmentSupported()
  );

  /**
   * Check if the solver supports the given instruction. This is used to render a small indication in the UI for each
   * instruction in the editor.
   *
   * @param instructionId The unique identifier of the instruction.
   */
  public isInstructionSupported(
    _grid: GridData,
    instruction: Instruction
  ): boolean {
    const symbol = allSymbols.get(instruction.id);
    if (symbol) {
      return !symbol.validateWithSolution;
    }
    const rule = allRules.get(instruction.id);
    if (rule) {
      return !rule.validateWithSolution || rule.id === undercluedInstance.id;
    }
    return false;
  }

  /**
   * Check if the solver supports the given grid. This methid is frequently called when the user changes the grid, and
   * the result is used to enable or disable the "Solve" button.
   *
   * The `solve` method will not be called if this method returns `false`, and a message will be displayed to the user
   * indicating that the grid is not supported by this solver.
   *
   * @param grid The grid to check.
   * @returns `true` if the grid is supported, or `false` otherwise.
   */
  public isGridSupported(grid: GridData): boolean {
    if (
      grid.rules.some(
        rule =>
          rule.necessaryForCompletion &&
          !this.isInstructionSupported(grid, rule)
      )
    ) {
      return false;
    }
    if (
      [...grid.symbols.values()].some(symbols =>
        symbols.some(
          s => s.necessaryForCompletion && !this.isInstructionSupported(grid, s)
        )
      )
    ) {
      return false;
    }
    return true;
  }
}

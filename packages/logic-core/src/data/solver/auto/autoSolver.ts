import GridData from '../../grid.js';
import { Color, State } from '../../primitives.js';
import { instance as lyingSymbolInstance } from '../../rules/lyingSymbolRule.js';
import { instance as offByXInstance } from '../../rules/offByXRule.js';
import { instance as wrapAroundInstance } from '../../rules/wrapAroundRule.js';
import { instance as symbolsPerRegionInstance } from '../../rules/symbolsPerRegionRule.js';
import { instance as areaNumberInstance } from '../../symbols/areaNumberSymbol.js';
import { instance as letterInstance } from '../../symbols/letterSymbol.js';
import { allSolvers } from '../allSolvers.js';
import Solver from '../solver.js';
import UndercluedRule from '../../rules/undercluedRule.js';
import validateGrid from '../../validate.js';
import Instruction from '../../instruction.js';

export default class AutoSolver extends Solver {
  public readonly id = 'auto';

  public readonly author = 'various contributors';

  public readonly description =
    'Automatically select the fastest solver based on supported instructions and environment.';

  public readonly supportsCancellation = true;

  private static readonly nonAdditiveInstructions = new Set([
    offByXInstance.id,
    lyingSymbolInstance.id,
    wrapAroundInstance.id,
    symbolsPerRegionInstance.id,
  ]);

  public isGridSupported(grid: GridData): boolean {
    for (const solver of allSolvers.values()) {
      if (solver.id === this.id) continue;
      if (solver.isGridSupported(grid)) {
        return true;
      }
    }
    return false;
  }

  public isInstructionSupported(
    grid: GridData,
    instruction: Instruction
  ): boolean {
    for (const solver of allSolvers.values()) {
      if (solver.id === this.id) continue;
      if (solver.isInstructionSupported(grid, instruction)) {
        return true;
      }
    }
    return false;
  }

  protected async isEnvironmentSupported(): Promise<boolean> {
    for (const solver of allSolvers.values()) {
      if (solver.id === this.id) continue;
      if (await solver.environmentCheck.value) {
        return true;
      }
    }
    return false;
  }

  private fillSolution(grid: GridData, solution: GridData): GridData {
    return grid.withTiles(tiles => {
      return tiles.map((row, y) =>
        row.map((tile, x) => {
          if (!tile.exists || tile.fixed) return tile;
          const solutionTile = solution.tiles[y][x];
          return tile.withColor(solutionTile.color);
        })
      );
    });
  }

  private fixGrid(grid: GridData): GridData {
    return grid.withTiles(tiles => {
      return tiles.map(row =>
        row.map(tile => {
          if (tile.fixed) return tile;
          return tile.withFixed(tile.color !== Color.Gray);
        })
      );
    });
  }

  private async *solveWithProgress(
    solver: Solver,
    grid: GridData,
    progress: GridData,
    abortSignal?: AbortSignal
  ): AsyncGenerator<GridData | null> {
    for await (const updatedGrid of solver.solve(progress, abortSignal)) {
      if (abortSignal?.aborted) return;
      if (!updatedGrid) {
        yield updatedGrid;
        return;
      }
      yield this.fillSolution(grid, updatedGrid);
    }
  }

  private async solveOne(
    generator: AsyncGenerator<GridData | null>
  ): Promise<GridData | null> {
    for await (const grid of generator) {
      return grid;
    }
    return null;
  }

  public async *solve(
    grid: GridData,
    abortSignal?: AbortSignal
  ): AsyncGenerator<GridData | null> {
    if (
      !!grid.findRule(r => AutoSolver.nonAdditiveInstructions.has(r.id)) ||
      !!grid.findSymbol(s => AutoSolver.nonAdditiveInstructions.has(s.id))
    ) {
      for (const solver of allSolvers.values()) {
        if (solver.id === this.id) continue;
        if (solver.isGridSupported(grid)) {
          yield* solver.solve(grid, abortSignal);
          return;
        }
      }
      throw new Error('No solver supports the given grid');
    } else {
      let progressGrid = grid;
      for (const solver of allSolvers.values()) {
        if (solver.id === this.id) continue;
        if (solver.isGridSupported(progressGrid)) {
          yield* this.solveWithProgress(
            solver,
            grid,
            progressGrid,
            abortSignal
          );
          return;
        } else if (solver.isGridSupported(grid)) {
          yield* solver.solve(grid, abortSignal);
          return;
        } else {
          const undercluedGrid = progressGrid
            .withRules(rules =>
              rules.filter(r => solver.isInstructionSupported(progressGrid, r))
            )
            .withSymbols(symbols => {
              for (const [id, symbolList] of symbols.entries()) {
                symbols.set(
                  id,
                  symbolList.filter(
                    symbol =>
                      // special handling: do not delete area number and letter symbols as they can be solved
                      // underclued even if the solver doesn't fully support them
                      symbol.id === areaNumberInstance.id ||
                      symbol.id === letterInstance.id ||
                      solver.isInstructionSupported(progressGrid, symbol)
                  )
                );
              }
              return symbols;
            })
            .addRule(new UndercluedRule());
          if (!solver.isGridSupported(undercluedGrid)) continue;
          const undercluedSolution = await this.solveOne(
            this.solveWithProgress(
              solver,
              progressGrid,
              undercluedGrid,
              abortSignal
            )
          );
          if (undercluedSolution === null) continue;
          if (undercluedSolution.getTileCount(true, false, Color.Gray) === 0) {
            const result = this.fillSolution(grid, undercluedSolution);
            if (validateGrid(result, null).final !== State.Error) {
              yield result;
              yield null;
              return;
            } else {
              yield null;
              return;
            }
          }
          progressGrid = this.fixGrid(undercluedSolution);
        }
      }
      yield this.fillSolution(grid, progressGrid);
    }
  }
}

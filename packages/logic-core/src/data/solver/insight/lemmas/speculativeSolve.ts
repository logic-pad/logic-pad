import GridData from '../../../grid.js';
import { Color, State } from '../../../primitives.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import allLemmas from './allLemmas.js';
import { runLemmaLoop } from '../lemmaLoop.js';
import validateGrid from '../../../validate.js';
import InsightError from '../types/insightError.js';
import Proof from '../types/proof.js';
import { cell, modifyTiles, setColor, setOppositeColor } from '../helper.js';

const COLORS = [Color.Dark, Color.Light] as const;

interface Contradiction {
  x: number;
  y: number;
  color: Color;
  /** Number of successful lemma applications needed to reach the contradiction. */
  lemmaCount: number;
  cellsFilled: number;
  proof: Proof;
}

/**
 * Speculatively fills a gray cell with each color and tries to solve the rest of the puzzle
 * with all other lemmas. If a hypothesis leads to a contradiction (an insight error, or a grid
 * left in an invalid state), the cell must be the opposite color.
 *
 * When several hypotheses lead to contradictions, the one with the shortest path to
 * contradiction (fewest successful lemma applications) is reported. A speculation is
 * terminated early once its lemma count exceeds the current best, since it can no longer
 * improve it.
 *
 * The emitted proof includes the proofs of the speculative pass as children, ending with the
 * contradiction itself when one was detected by a lemma or store.
 *
 * This is the most powerful and most expensive lemma, so it is registered last and only runs
 * when no other lemma can make progress. It is excluded from its own speculative solve loops
 * to avoid recursion (the import cycle with `allLemmas` is safe: the list is only read at
 * apply time, after both modules are fully initialized).
 */
export default class SpeculativeSolve extends InsightLemma {
  public readonly id = 'speculative-solve';

  public isApplicable(_grid: GridData): boolean {
    return true;
  }

  public apply(context: InsightContext): boolean {
    const grid = context.grid;
    const lemmas = allLemmas.filter(
      lemma => lemma.id !== this.id && lemma.isApplicable(grid)
    );
    let best: Contradiction | null = null;
    speculationLoop: for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (!tile.exists || tile.fixed || tile.color !== Color.Gray) continue;
        for (const color of COLORS) {
          const hypothetical = context.copy();
          const hypothesisTiles = modifyTiles(hypothetical.grid);
          setColor(hypothetical.grid, hypothesisTiles, x, y, color);
          hypothetical.setTiles(hypothesisTiles);
          const baseHistoryLength = hypothetical.tileHistory.length;
          const grayBefore = hypothetical.grid.getTileCount(
            true,
            false,
            Color.Gray
          );
          let lemmaCount = 0;
          let contradiction: Proof | null = null;
          try {
            runLemmaLoop(hypothetical, lemmas, {
              onLemmaSuccess: (_, newHistory) => {
                lemmaCount += newHistory.length;
                if (validateGrid(hypothetical.grid, null).final === State.Error)
                  throw this.error('Grid is left in an invalid state');
                // This speculation can no longer beat the best one found so far.
                if (best !== null && lemmaCount > best.lemmaCount) return false;
              },
            });
          } catch (error) {
            if (error instanceof InsightError) {
              contradiction = Proof.create(error.source).describe(
                error.message
              );
            } else {
              // Unexpected error, rethrow
              throw error;
            }
          }
          if (!contradiction) {
            if (validateGrid(hypothetical.grid, null).final !== State.Error)
              continue;
          }
          if (best !== null && lemmaCount >= best.lemmaCount) continue;
          const cellsFilled =
            grayBefore -
            hypothetical.grid.getTileCount(true, false, Color.Gray);
          const proof = this.proof()
            .difficulty(0)
            .describe(`If cell at ${cell({ x, y })} is ${color}, then:`);
          for (const history of hypothetical.tileHistory.slice(
            baseHistoryLength
          )) {
            proof.add(history.proof);
          }
          if (contradiction) proof.add(contradiction);
          else
            proof.add(
              this.proof().describe('Grid is left in an invalid state')
            );
          best = { x, y, color, lemmaCount, cellsFilled, proof };
          // A contradiction without any deduction cannot be beaten.
          if (best.lemmaCount === 0) break speculationLoop;
        }
      }
    }
    if (!best) return false;
    if (best.lemmaCount === 0) return false; // todo: we do not want to cover 0-step speculations because new lemmas should be developed for this
    const newTiles = modifyTiles(grid);
    setOppositeColor(grid, newTiles, best.x, best.y, best.color);
    context.setTiles(
      newTiles,
      this.proof()
        .difficulty(4)
        .describe(
          best.lemmaCount === 0
            ? `Cell at ${cell({ x: best.x, y: best.y })} cannot be ${best.color} because it leads to a contradiction immediately, so it must be ${best.color === Color.Dark ? Color.Light : Color.Dark}`
            : `Cell at ${cell({ x: best.x, y: best.y })} cannot be ${best.color} because it leads to a contradiction after ${best.lemmaCount} deduction${best.lemmaCount === 1 ? '' : 's'} filling ${best.cellsFilled} more cells, so it must be ${best.color === Color.Dark ? Color.Light : Color.Dark}`
        )
        .add(best.proof)
    );
    return true;
  }
}

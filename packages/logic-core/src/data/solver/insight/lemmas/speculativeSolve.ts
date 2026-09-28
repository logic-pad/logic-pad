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

/**
 * Speculatively fills a gray cell with each color and tries to solve the rest of the puzzle
 * with all other lemmas. If a hypothesis leads to a contradiction (an insight error, or a grid
 * left in an invalid state), the cell must be the opposite color.
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
    for (let y = 0; y < grid.height; y++) {
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
          let contradiction: Proof | null = null;
          try {
            runLemmaLoop(hypothetical, lemmas);
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
          if (
            !contradiction &&
            validateGrid(hypothetical.grid, null).final !== State.Error
          )
            continue;
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
          const newTiles = modifyTiles(grid);
          setOppositeColor(grid, newTiles, x, y, color);
          context.setTiles(
            newTiles,
            this.proof()
              .difficulty(4)
              .describe(
                `Cell at ${cell({ x, y })} cannot be ${color} because it leads to a contradiction after filling ${cellsFilled} more cells, so it must be ${color === Color.Dark ? Color.Light : Color.Dark}`
              )
              .add(proof)
          );
          return true;
        }
      }
    }
    return false;
  }
}

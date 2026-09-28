import InsightContext, { TileChange } from './insightContext.js';
import InsightLemma from './lemmas/insightLemma.js';

export interface LemmaLoopHooks {
  /** Called at the start of each full pass over the lemma list. */
  onPassStart?: () => void;
  /** Called before each lemma attempt with its index in the list. */
  onLemmaStart?: (index: number) => void;
  /**
   * Called when a lemma made progress, with the tile history entries it added.
   * Return `false` to stop the loop entirely instead of restarting from the first lemma.
   */
  onLemmaSuccess?: (
    lemma: InsightLemma,
    newHistory: readonly TileChange[]
  ) => boolean | void;
  /** Called when a lemma made no progress. */
  onLemmaNoChange?: (lemma: InsightLemma) => void;
}

/**
 * The insight solver's main loop: iterate the lemmas in order and apply them to the context.
 * As soon as one makes progress, restart from the first lemma — cheap deductions are always
 * re-attempted before expensive ones. The loop ends after a full pass with no changes.
 *
 * Used by the worker for real solves and by speculative lemmas on copied contexts.
 */
export function runLemmaLoop(
  context: InsightContext,
  lemmas: readonly InsightLemma[],
  hooks: LemmaLoopHooks = {}
): void {
  let lastHistoryLength = 0;
  let restart = true;
  mainLoop: while (restart) {
    restart = false;
    hooks.onPassStart?.();
    lemmaLoop: for (const [index, lemma] of lemmas.entries()) {
      hooks.onLemmaStart?.(index);
      const changed = lemma.apply(context);
      if (changed) {
        const stop =
          hooks.onLemmaSuccess?.(
            lemma,
            context.tileHistory.slice(lastHistoryLength)
          ) === false;
        lastHistoryLength = context.tileHistory.length;
        restart = true;
        if (stop) {
          break mainLoop;
        } else {
          break lemmaLoop;
        }
      } else {
        hooks.onLemmaNoChange?.(lemma);
      }
    }
  }
}

import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import LetterSymbol, {
  instance as letterInstance,
} from '../../../symbols/letterSymbol.js';
import { area } from '../helper.js';

/**
 * Disconnects regions that contain different letters: letters must be sorted into one type
 * per area, so cells with different letters can never belong to the same region.
 */
export default class DisconnectDifferentLetters extends InsightLemma {
  public readonly id = 'disconnect-different-letters';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(symbol => symbol.id === letterInstance.id);
  }

  public apply(context: InsightContext): boolean {
    const symbols = context.grid.symbols.get(letterInstance.id) ?? [];
    let progress = false;
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbolA = symbols[i] as LetterSymbol;
        const symbolB = symbols[j] as LetterSymbol;
        if (symbolA.letter === symbolB.letter) continue;
        const posA = { x: Math.floor(symbolA.x), y: Math.floor(symbolA.y) };
        const posB = { x: Math.floor(symbolB.x), y: Math.floor(symbolB.y) };
        const modified = context.regions.addDisconnected(
          posA,
          posB,
          this.proof()
            .difficulty(1)
            .describe(
              `${area(posA)} and ${area(posB)} must be separate because they have different letters`
            )
        );
        progress ||= modified;
      }
    }
    return progress;
  }
}

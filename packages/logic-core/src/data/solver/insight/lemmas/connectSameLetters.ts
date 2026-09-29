import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import LetterSymbol, {
  instance as letterInstance,
} from '../../../symbols/letterSymbol.js';
import { area } from '../helper.js';

/**
 * Connects regions that contain the same letter: letters must be sorted into one type per
 * area, so all cells with the same letter belong to the same region.
 */
export default class ConnectSameLetters extends InsightLemma {
  public readonly id = 'connect-same-letters';

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
        if (symbolA.letter !== symbolB.letter) continue;
        const posA = { x: Math.floor(symbolA.x), y: Math.floor(symbolA.y) };
        const posB = { x: Math.floor(symbolB.x), y: Math.floor(symbolB.y) };
        const modified = context.regions.addConnected(
          posA,
          posB,
          this.proof()
            .difficulty(1)
            .describe(
              `${area(posA)} and ${area(posB)} must be connected because they both have the letter ${symbolA.letter}`
            )
        );
        progress ||= modified;
      }
    }
    return progress;
  }
}

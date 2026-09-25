import GridData from '../../../grid.js';
import InsightContext from '../insightContext.js';
import InsightLemma from './insightLemma.js';
import { instance as areaNumberInstance } from '../../../symbols/areaNumberSymbol.js';
import { instance as everyLetterInstance } from '../../../symbols/everyLetterSymbol.js';
import { instance as houseInstance } from '../../../symbols/houseSymbol.js';
import { instance as letterInstance } from '../../../symbols/letterSymbol.js';
import { modifyTiles, setColor } from '../helper.js';
import { Color } from '../../../primitives.js';

const SUBTILE_SYMBOLS = [
  areaNumberInstance.id,
  everyLetterInstance.id,
  houseInstance.id,
  letterInstance.id,
];

export default class CompleteSubtileSymbol extends InsightLemma {
  public readonly id = 'complete-subtile-symbol';

  public isApplicable(grid: GridData): boolean {
    return !!grid.findSymbol(
      symbol =>
        SUBTILE_SYMBOLS.includes(symbol.id) &&
        (symbol.x % 1 !== 0 || symbol.y % 1 !== 0)
    );
  }

  public apply(context: InsightContext): boolean {
    let progress = false;
    for (const symbolType of SUBTILE_SYMBOLS) {
      for (const [_, symbol] of context.grid.symbols
        .get(symbolType)
        ?.entries() ?? []) {
        if (symbol.x % 1 === 0 && symbol.y % 1 === 0) continue;
        const minX = Math.floor(symbol.x);
        const minY = Math.floor(symbol.y);
        const maxX = Math.ceil(symbol.x);
        const maxY = Math.ceil(symbol.y);
        const subtilePositions = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: minX, y: maxY },
          { x: maxX, y: maxY },
        ];
        const colors = subtilePositions
          .map(pos => {
            const tile = context.grid.getTile(pos.x, pos.y);
            return tile.exists ? tile.color : null;
          })
          .filter((color): color is Color => color !== null);
        if (colors.every(color => color === Color.Gray)) continue;
        if (!colors.includes(Color.Gray)) continue;
        if (colors.includes(Color.Dark) && colors.includes(Color.Light)) {
          throw this.error(
            `Symbol at (${symbol.x}, ${symbol.y}) cannot be completed because it touches both dark and light tiles`
          );
        }
        const color = colors.find(color => color !== Color.Gray)!;
        let changed = false;
        const newTiles = modifyTiles(context.grid);
        subtilePositions.forEach(pos => {
          const tile = context.grid.getTile(pos.x, pos.y);
          if (tile.exists && !tile.fixed && tile.color === Color.Gray) {
            setColor(context.grid, newTiles, pos.x, pos.y, color);
            changed = true;
          }
        });
        if (changed) {
          context.setTiles(
            newTiles,
            this.proof()
              .difficulty(1)
              .describe(
                `Symbol at (${symbol.x}, ${symbol.y}) touches ${color} tiles, so all adjacent gray tiles must be filled in`
              )
          );
          progress = true;
        }
      }
    }
    return progress;
  }
}

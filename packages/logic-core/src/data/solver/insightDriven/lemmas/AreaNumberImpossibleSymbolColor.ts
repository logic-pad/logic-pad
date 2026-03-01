import { Lemma } from '../lemmaUtils.js';
import AreaNumberSymbol, {
  instance as areaNumberInstance,
} from '../../../symbols/areaNumberSymbol.js';
import { instance as offByXInstance } from '../../../rules/offByXRule.js';
import { Color, State } from '../../../primitives.js';
import GridData from '../../../grid.js';

function getUnsatisfiedGrayAreaNumberSymbols(
  grid: GridData
): AreaNumberSymbol[] {
  return (grid.symbols.get(areaNumberInstance.id) as AreaNumberSymbol[]).filter(
    symbol =>
      symbol.validateSymbol(grid) !== State.Satisfied &&
      grid.getTile(Math.floor(symbol.x), Math.floor(symbol.y)).color ===
        Color.Gray
  );
}

export class AreaNumberImpossibleSymbolColor extends Lemma {
  public readonly id = 'AreaNumberImpossibleSymbolColor';
  public readonly score = 3;

  public apply(grid: GridData): [boolean, GridData] {
    // Find the first area number symbol which is not satisfied and has exactly the right number of tiles
    const unsatisfiedGrayAreaNumberSymbol: AreaNumberSymbol[] =
      getUnsatisfiedGrayAreaNumberSymbols(grid);
    let areaNumberSymbol: AreaNumberSymbol | undefined;
    const checks = [false, false];
    let tmpGrid1, tmpGrid2: GridData;
    for (const symbol of unsatisfiedGrayAreaNumberSymbol) {
      tmpGrid1 = grid.copyWith(
        {
          tiles: grid.setTile(
            Math.floor(symbol.x),
            Math.floor(symbol.y),
            grid
              .getTile(Math.floor(symbol.x), Math.floor(symbol.y))
              .withColor(Color.Dark)
          ),
        },
        false,
        false
      );
      const count1 = symbol.countTiles(tmpGrid1);
      if (!count1) continue;
      checks[0] = count1.possible >= symbol.number;
      tmpGrid2 = grid.copyWith(
        {
          tiles: grid.setTile(
            Math.floor(symbol.x),
            Math.floor(symbol.y),
            grid
              .getTile(Math.floor(symbol.x), Math.floor(symbol.y))
              .withColor(Color.Light)
          ),
        },
        false,
        false
      );
      const count2 = symbol.countTiles(tmpGrid2);
      if (!count2) continue;
      checks[1] = count2.possible >= symbol.number;
      // If only one of the two colors is possible, take it
      if (checks[0] !== checks[1]) {
        areaNumberSymbol = symbol;
        break;
      }
    }
    if (!areaNumberSymbol) return [false, grid]; // No symbol found
    return [true, (checks[0] ? tmpGrid1 : tmpGrid2!)!];
  }

  public isApplicable(grid: GridData) {
    return Lemma.basicRequirements(grid, [
      {
        instructionId: areaNumberInstance.id,
        presence: true,
      },
      {
        instructionId: offByXInstance.id,
        presence: false,
      },
    ]);
  }
}

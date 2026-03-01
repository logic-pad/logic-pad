import { Lemma } from '../lemmaUtils.js';
import AreaNumberSymbol, {
  instance as areaNumberInstance,
} from '../../../symbols/areaNumberSymbol.js';
import { instance as offByXInstance } from '../../../rules/offByXRule.js';
import { Color, State } from '../../../primitives.js';
import GridData from '../../../grid.js';

function getUnsatisfiedAreaNumberSymbols(grid: GridData): AreaNumberSymbol[] {
  return (grid.symbols.get(areaNumberInstance.id) as AreaNumberSymbol[]).filter(
    symbol => symbol.validateSymbol(grid) !== State.Satisfied
  );
}

export class AreaNumberHasRightSize extends Lemma {
  public readonly id = 'AreaNumberHasRightSize';
  public readonly score = 1;

  public apply(grid: GridData): [boolean, GridData] {
    // Find the first area number symbol which is not satisfied and has exactly the right number of tiles
    const unsatisfiedAreaNumberSymbol: AreaNumberSymbol[] =
      getUnsatisfiedAreaNumberSymbols(grid);
    const areaNumberSymbol: AreaNumberSymbol = unsatisfiedAreaNumberSymbol.find(
      symbol => symbol.countTiles(grid)?.completed === symbol.number
    )!;
    if (!areaNumberSymbol) return [false, grid]; // No symbol found
    // Surround the empty tiles around the area number region using the opposite color
    const thisX = Math.floor(areaNumberSymbol.x);
    const thisY = Math.floor(areaNumberSymbol.y);
    const color = grid.getTile(thisX, thisY).color;
    const oppositeColor = color === Color.Dark ? Color.Light : Color.Dark;
    const regionTiles: { x: number; y: number }[] = [];
    // Get the region tiles
    grid.iterateArea(
      { x: thisX, y: thisY },
      tile => tile.color === color,
      (_tile, x, y) => {
        regionTiles.push({ x, y });
      }
    );
    // Fill the empty tiles around the region
    grid.iterateArea(
      { x: thisX, y: thisY },
      tile => tile.color === Color.Gray || tile.color === color,
      (tile, x, y) => {
        if (
          tile.color === Color.Gray &&
          regionTiles.some(
            t =>
              (t.x === x && Math.abs(t.y - y) === 1) ||
              (t.y === y && Math.abs(t.x - x) === 1)
          )
        ) {
          grid = grid.copyWith(
            {
              tiles: grid.setTile(x, y, tile.withColor(oppositeColor)),
            },
            false,
            false
          );
        }
      }
    );
    return [true, grid];
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

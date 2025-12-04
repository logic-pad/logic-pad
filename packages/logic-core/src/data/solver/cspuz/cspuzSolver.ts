import { instance as banPatternInstance } from '../../rules/banPatternRule.js';
import { instance as cellCountInstance } from '../../rules/cellCountRule.js';
import { instance as regionAreaInstance } from '../../rules/regionAreaRule.js';
import { instance as sameShapeInstance } from '../../rules/sameShapeRule.js';
import { instance as symbolsPerRegionInstance } from '../../rules/symbolsPerRegionRule.js';
import { instance as undercluedInstance } from '../../rules/undercluedRule.js';
import { instance as uniqueShapeInstance } from '../../rules/uniqueShapeRule.js';
import { instance as offByXInstance } from '../../rules/offByXRule.js';
import AreaNumberSymbol, {
  instance as areaNumberInstance,
} from '../../symbols/areaNumberSymbol.js';
import { instance as dartInstance } from '../../symbols/dartSymbol.js';
import GalaxySymbol, {
  instance as galaxyInstance,
} from '../../symbols/galaxySymbol.js';
import LetterSymbol, {
  instance as letterInstance,
} from '../../symbols/letterSymbol.js';
import LotusSymbol, {
  instance as lotusInstance,
} from '../../symbols/lotusSymbol.js';
import { instance as minesweeperInstance } from '../../symbols/minesweeperSymbol.js';
import { instance as viewpointInstance } from '../../symbols/viewpointSymbol.js';
import { instance as connectAllInstance } from '../../rules/connectAllRule.js';
import EventIteratingSolver from '../eventIteratingSolver.js';
import GridData from '../../grid.js';
import { Color } from '../../primitives.js';
import Instruction from '../../instruction.js';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
('vite-apply-code-mod');

export default class CspuzSolver extends EventIteratingSolver {
  private static readonly supportedInstrs = [
    minesweeperInstance.id,
    areaNumberInstance.id,
    letterInstance.id,
    dartInstance.id,
    viewpointInstance.id,
    lotusInstance.id,
    galaxyInstance.id,
    connectAllInstance.id,
    banPatternInstance.id,
    sameShapeInstance.id,
    uniqueShapeInstance.id,
    regionAreaInstance.id,
    cellCountInstance.id,
    offByXInstance.id,
    undercluedInstance.id,
    symbolsPerRegionInstance.id,
  ];

  public readonly id = 'cspuz';

  public readonly author = 'semiexp';

  public readonly description =
    'A blazingly fast WebAssembly solver that supports most rules and symbols (including underclued).';

  protected createWorker(): Worker {
    return new Worker(new URL('./cspuzWorker.js', import.meta.url), {
      type: 'module',
    });
  }

  public isGridSupported(grid: GridData): boolean {
    if (!super.isGridSupported(grid)) {
      return false;
    }

    // special handling for fixed gray tiles
    if (grid.getTileCount(true, true, Color.Gray) > 0) {
      return false;
    }

    return true;
  }

  public isInstructionSupported(
    grid: GridData,
    instruction: Instruction
  ): boolean {
    if (
      instruction instanceof LotusSymbol ||
      instruction instanceof GalaxySymbol
    ) {
      if (instruction.x % 1 !== 0 && instruction.y % 1 !== 0) {
        return false;
      }
    }
    if (
      instruction instanceof LotusSymbol ||
      instruction instanceof GalaxySymbol ||
      instruction instanceof AreaNumberSymbol ||
      instruction instanceof LetterSymbol
    ) {
      if (instruction.x % 1 !== 0 || instruction.y % 1 !== 0) {
        const minX = Math.floor(instruction.x);
        const minY = Math.floor(instruction.y);
        const maxX = Math.ceil(instruction.x);
        const maxY = Math.ceil(instruction.y);
        const connectedTiles = grid.connections.getConnectedTiles({
          x: minX,
          y: minY,
        });
        if (
          connectedTiles.some(tile => tile.x === minX && tile.y === maxY) &&
          connectedTiles.some(tile => tile.x === maxX && tile.y === minY) &&
          connectedTiles.some(tile => tile.x === maxX && tile.y === maxY)
        ) {
          return true;
        }
        let color = Color.Gray;
        for (let i = 0; i < 4; i++) {
          const x = i % 2 === 0 ? minX : maxX;
          const y = i < 2 ? minY : maxY;
          const tile = grid.getTile(x, y);
          if (!tile.fixed || !tile.exists) {
            return false;
          }
          if (tile.color !== Color.Gray) {
            if (color === Color.Gray) {
              color = tile.color;
            } else if (color !== tile.color) {
              return false;
            }
          }
        }
        return true;
      }
    }
    return CspuzSolver.supportedInstrs.includes(instruction.id);
  }

  public async isEnvironmentSupported(): Promise<boolean> {
    try {
      for await (const _ of this.solve(GridData.create(['.']))) {
        // do nothing
      }
      return true;
    } catch (_ex) {
      return false;
    }
  }
}

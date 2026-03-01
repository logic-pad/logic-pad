import { instance as banPatternInstance } from '../../rules/banPatternRule.js';
import { instance as cellCountInstance } from '../../rules/cellCountRule.js';
import { instance as regionAreaInstance } from '../../rules/regionAreaRule.js';
import { instance as sameShapeInstance } from '../../rules/sameShapeRule.js';
import { instance as symbolsPerRegionInstance } from '../../rules/symbolsPerRegionRule.js';
import { instance as undercluedInstance } from '../../rules/undercluedRule.js';
import { instance as uniqueShapeInstance } from '../../rules/uniqueShapeRule.js';
import { instance as areaNumberInstance } from '../../symbols/areaNumberSymbol.js';
import { instance as dartInstance } from '../../symbols/dartSymbol.js';
import { instance as galaxyInstance } from '../../symbols/galaxySymbol.js';
import { instance as letterInstance } from '../../symbols/letterSymbol.js';
import { instance as lotusInstance } from '../../symbols/lotusSymbol.js';
import { instance as minesweeperInstance } from '../../symbols/minesweeperSymbol.js';
import { instance as focusInstance } from '../../symbols/focusSymbol.js';
import { instance as myopiaInstance } from '../../symbols/myopiaSymbol.js';
import { instance as viewpointInstance } from '../../symbols/viewpointSymbol.js';
import { instance as connectAllInstance } from '../../rules/connectAllRule.js';
import { instance as unsupportedInstance } from '../../symbols/unsupportedSymbol.js';
import EventIteratingSolver from '../eventIteratingSolver.js';
import Instruction from '../../instruction.js';
import GridData from '../../grid.js';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
('vite-apply-code-mod');

export default class BacktrackSolver extends EventIteratingSolver {
  private static readonly supportedInstrs = [
    areaNumberInstance.id,
    viewpointInstance.id,
    dartInstance.id,
    galaxyInstance.id,
    lotusInstance.id,
    myopiaInstance.id,
    minesweeperInstance.id,
    focusInstance.id,
    letterInstance.id,
    undercluedInstance.id,
    connectAllInstance.id,
    banPatternInstance.id,
    regionAreaInstance.id,
    symbolsPerRegionInstance.id,
    cellCountInstance.id,
    sameShapeInstance.id,
    uniqueShapeInstance.id,
    unsupportedInstance.id,
  ];

  public readonly id = 'backtrack';

  public readonly author = 'ALaggyDev';

  public readonly description =
    'Solves puzzles pretty fast using backtracking with optimizations. Support most rules and symbols (including underclued).';

  protected createWorker(): Worker {
    return new Worker(new URL(`./backtrackWorker.js`, import.meta.url), {
      type: 'module',
    });
  }

  public isInstructionSupported(
    _grid: GridData,
    instruction: Instruction
  ): boolean {
    return BacktrackSolver.supportedInstrs.includes(instruction.id);
  }
}

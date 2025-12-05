import { PuzzleData, Rule } from 'logic-pad-solver-core';
import { Color, Comparison } from '../../primitives.js';
import BanPatternRule from '../../rules/banPatternRule.js';
import CellCountRule from '../../rules/cellCountRule.js';
import ConnectAllRule from '../../rules/connectAllRule.js';
import OffByXRule from '../../rules/offByXRule.js';
import RegionAreaRule from '../../rules/regionAreaRule.js';
import SameShapeRule from '../../rules/sameShapeRule.js';
import SymbolsPerRegionRule from '../../rules/symbolsPerRegionRule.js';
import UndercluedRule from '../../rules/undercluedRule.js';
import UniqueShapeRule from '../../rules/uniqueShapeRule.js';
import AreaNumberSymbol, {
  instance as areaNumberInstance,
} from '../../symbols/areaNumberSymbol.js';
import DartSymbol, {
  instance as dartInstance,
} from '../../symbols/dartSymbol.js';
import GalaxySymbol, {
  instance as galaxyInstance,
} from '../../symbols/galaxySymbol.js';
import LetterSymbol, {
  instance as letterInstance,
} from '../../symbols/letterSymbol.js';
import LotusSymbol, {
  instance as lotusInstance,
} from '../../symbols/lotusSymbol.js';
import MinesweeperSymbol, {
  instance as minesweeperInstance,
} from '../../symbols/minesweeperSymbol.js';
import ViewpointSymbol, {
  instance as viewpointInstance,
} from '../../symbols/viewpointSymbol.js';
import { instance as unsupportedInstance } from '../../symbols/unsupportedSymbol.js';
import TileData from '../../tile.js';
import GridData from '../../grid.js';

function canonizeTiles(
  tileData: readonly (readonly TileData[])[]
): TileData[][] {
  const ret = [];
  for (const row of tileData) {
    const newRow = [];
    for (const tile of row) {
      if (tile.exists) {
        newRow.push(tile);
      } else {
        newRow.push(new TileData(true, false, Color.Gray));
      }
    }
    ret.push(newRow);
  }
  return ret;
}

export function gridToJson(grid: GridData): PuzzleData {
  const rules: Rule[] = [];

  for (const rule of grid.rules) {
    if (rule instanceof ConnectAllRule) {
      rules.push({
        type: 'connectAll',
        color: rule.color,
      });
    } else if (rule instanceof BanPatternRule) {
      rules.push({
        type: 'forbiddenPattern',
        pattern: canonizeTiles(rule.pattern.tiles),
      });
    } else if (rule instanceof SameShapeRule) {
      rules.push({
        type: 'sameShape',
        color: rule.color,
      });
    } else if (rule instanceof UniqueShapeRule) {
      rules.push({
        type: 'uniqueShape',
        color: rule.color,
      });
    } else if (rule instanceof RegionAreaRule) {
      rules.push({
        type: 'regionArea',
        color: rule.color,
        size: rule.size,
      });
    } else if (rule instanceof CellCountRule) {
      rules.push({
        type: 'cellCount',
        color: rule.color,
        count: rule.count,
      });
    } else if (rule instanceof OffByXRule) {
      rules.push({
        type: 'offByX',
        number: rule.number,
      });
    } else if (rule instanceof UndercluedRule) {
      continue;
    } else if (rule instanceof SymbolsPerRegionRule) {
      let kind: 'exactly' | 'atLeast' | 'atMost';
      if (rule.comparison === Comparison.Equal) {
        kind = 'exactly';
      } else if (rule.comparison === Comparison.AtLeast) {
        kind = 'atLeast';
      } else if (rule.comparison === Comparison.AtMost) {
        kind = 'atMost';
      } else {
        throw new Error(`Unknown comparison (${rule.comparison as string})`);
      }
      rules.push({
        type: 'symbolCount',
        number: rule.count,
        kind,
        color: rule.color,
      });
    } else if (rule.necessaryForCompletion) {
      throw new Error(`Unknown rule type (${rule.explanation})`);
    }
  }

  for (const [rule, symbols] of grid.symbols) {
    if (rule === minesweeperInstance.id) {
      rules.push({
        type: 'minesweeper',
        tiles: (symbols as MinesweeperSymbol[]).map(s => ({
          x: Math.floor(s.x),
          y: Math.floor(s.y),
          number: s.number,
        })),
      });
    } else if (rule === areaNumberInstance.id) {
      rules.push({
        type: 'number',
        tiles: (symbols as AreaNumberSymbol[]).map(s => ({
          x: Math.floor(s.x),
          y: Math.floor(s.y),
          number: s.number,
        })),
      });
    } else if (rule === letterInstance.id) {
      rules.push({
        type: 'letter',
        tiles: (symbols as LetterSymbol[]).map(s => ({
          x: Math.floor(s.x),
          y: Math.floor(s.y),
          letter: s.letter,
        })),
      });
    } else if (rule === dartInstance.id) {
      rules.push({
        type: 'dart',
        tiles: (symbols as DartSymbol[]).map(s => ({
          x: Math.floor(s.x),
          y: Math.floor(s.y),
          orientation: s.orientation,
          number: s.number,
        })),
      });
    } else if (rule === viewpointInstance.id) {
      rules.push({
        type: 'viewpoint',
        tiles: (symbols as ViewpointSymbol[]).map(s => ({
          x: Math.floor(s.x),
          y: Math.floor(s.y),
          number: s.number,
        })),
      });
    } else if (rule === lotusInstance.id) {
      const tiles = (symbols as LotusSymbol[]).map(s => ({
        x: Math.round(s.x * 2),
        y: Math.round(s.y * 2),
        orientation: s.orientation,
      }));

      rules.push({
        type: 'lotus',
        tiles,
      });
    } else if (rule === galaxyInstance.id) {
      const tiles = (symbols as GalaxySymbol[]).map(s => ({
        x: Math.round(s.x * 2),
        y: Math.round(s.y * 2),
      }));

      rules.push({
        type: 'galaxy',
        tiles,
      });
    } else if (rule === unsupportedInstance.id) {
      continue;
    } else if (symbols.some(s => s.necessaryForCompletion)) {
      throw new Error(`Unknown symbol type: ${rule}`);
    }
  }

  const connections = grid.connections.edges.map(edge => {
    return {
      x1: edge.x1,
      y1: edge.y1,
      x2: edge.x2,
      y2: edge.y2,
    };
  });

  const tiles = grid.tiles.map(row => {
    return row.map(tile => {
      return {
        exists: tile.exists,
        fixed: tile.fixed,
        color: tile.color,
      };
    });
  });

  return {
    width: grid.width,
    height: grid.height,
    connections,
    tiles,
    rules,
  };
}

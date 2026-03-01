import { SolverResult, solveLogicPad } from 'logic-pad-solver-core';
import { Serializer } from '../../serializer/allSerializers.js';
import { gridToJson } from './jsonify.js';
import { instance as undercluedInstance } from '../../rules/undercluedRule.js';
import { Color } from '../../primitives.js';
import GridData from '../../grid.js';

function stringToColor(str: 'dark' | 'light' | null): Color {
  if (str === 'dark') {
    return Color.Dark;
  } else if (str === 'light') {
    return Color.Light;
  } else {
    return Color.Gray;
  }
}

function postSolution(grid: GridData, solverResult: SolverResult) {
  if (solverResult === null) {
    postMessage(null);
  } else if ('error' in solverResult) {
    throw new Error(solverResult.error);
  } else {
    const solution = grid.withTiles(tiles => {
      for (const [y, row] of solverResult.entries()) {
        for (const [x, color] of row.entries()) {
          tiles[y][x] = tiles[y][x].withColor(stringToColor(color));
        }
      }
      return tiles;
    });
    postMessage(Serializer.stringifyGrid(solution));
  }
}

onmessage = e => {
  const grid = Serializer.parseGrid(e.data as string);
  const isUnderclued = !!grid.findRule(r => r.id === undercluedInstance.id);

  const puzzleData = gridToJson(grid);

  const solverResult = solveLogicPad(puzzleData, isUnderclued);

  postSolution(grid, solverResult);

  if (isUnderclued) {
    postMessage(null);
    return;
  }

  // Make use of the underclued mode to determine solution uniqueness
  if (solverResult !== null && !('error' in solverResult) && !isUnderclued) {
    const undercluedResult = solveLogicPad(puzzleData, true);

    if (undercluedResult === null) {
      postMessage(undefined); // Shouldn't happen because underclued grids should always be solvable
    } else if ('error' in undercluedResult) {
      throw new Error(undercluedResult.error);
    } else if (
      undercluedResult.every((row, y) =>
        row.every((cell, x) => cell !== null || !grid.getTile(x, y).exists)
      )
    ) {
      postMessage(null);
    } else {
      let tweaked = false;
      for (const [y, row] of undercluedResult.entries()) {
        for (const [x, color] of row.entries()) {
          if (color !== null) {
            puzzleData.tiles[y][x].fixed = true;
            puzzleData.tiles[y][x].color = color;
          } else if (!tweaked && puzzleData.tiles[y][x].exists) {
            const positions = grid.connections.getConnectedTiles({ x, y });
            const newColor = solverResult[y][x] === 'dark' ? 'light' : 'dark';
            positions.forEach(({ x: px, y: py }) => {
              puzzleData.tiles[py][px].fixed = true;
              puzzleData.tiles[py][px].color = newColor;
            });
            tweaked = true;
          }
        }
      }

      const secondResult = solveLogicPad(puzzleData, false);
      postSolution(grid, secondResult);
    }
  }

  postMessage(undefined);
};

export {};

import GridData from '../../grid.js';
import { Color, Position, State } from '../../primitives.js';
import { Serializer } from '../../serializer/allSerializers.js';
import TileData from '../../tile.js';
import { instance as undercluedInstance } from '../../rules/undercluedRule.js';
import { array } from '../../dataHelper.js';
import validateGrid from '../../validate.js';

function gridToRawTiles(grid: GridData): Color[][] {
  return array(grid.width, grid.height, (x, y) => grid.getTile(x, y).color);
}

function rawTilesToGrid(rawTiles: Color[][], grid: GridData): GridData {
  return grid.copyWith(
    {
      tiles: array(grid.width, grid.height, (x, y) =>
        grid.getTile(x, y).withColor(rawTiles[y][x])
      ),
    },
    false,
    false
  );
}

function getNextTile(
  grid: GridData,
  rawTiles: Color[][]
): [Position, Color] | undefined {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.getTile(x, y);
      if (!tile.exists || tile.fixed) continue;
      if (rawTiles[y][x] === Color.Gray) return [{ x, y }, Color.Dark];
    }
  }
  return undefined;
}

function backtrack(
  grid: GridData,
  rawTiles: Color[][],
  submitSolution: (rawTiles: Color[][] | null) => boolean
): boolean {
  // Find the best empty cell to guess
  const target = getNextTile(grid, rawTiles);

  // Found a solution
  if (!target) return !submitSolution(rawTiles);

  const [pos, color] = target;
  const positions = grid.connections.getConnectedTiles(pos);

  for (let i = 0; i <= 1; i++) {
    const tile =
      i === 0 ? color : color === Color.Dark ? Color.Light : Color.Dark;

    positions.forEach(({ x, y }) => (rawTiles[y][x] = tile));

    const newGrid = rawTilesToGrid(rawTiles, grid);

    const isValid = validateGrid(newGrid, null);

    if (
      isValid.final !== State.Error &&
      backtrack(newGrid, rawTiles, submitSolution)
    )
      return true;
  }
  positions.forEach(({ x, y }) => (rawTiles[y][x] = Color.Gray));
  return false;
}

function solveNormal(
  input: GridData,
  submitSolution: (grid: GridData | null) => boolean
) {
  const isValid = validateGrid(input, null);

  if (isValid.final === State.Error) {
    return;
  }

  // Call backtrack
  backtrack(input, gridToRawTiles(input), rawTiles =>
    submitSolution(rawTiles ? rawTilesToGrid(rawTiles, input) : null)
  );
}

function solveUnderclued(input: GridData): GridData | null {
  interface PossibleState {
    dark: boolean;
    light: boolean;
  }

  let grid = input;

  const possibles: PossibleState[][] = array(grid.width, grid.height, () => ({
    dark: false,
    light: false,
  }));

  function search(x: number, y: number, tile: TileData, color: Color): boolean {
    const newGrid = grid.copyWith(
      {
        tiles: grid.setTile(x, y, tile.withColor(color)),
      },
      false,
      false
    );

    // Solve
    let solution: GridData | null | undefined;
    solveNormal(newGrid, sol => {
      solution = sol;
      return false;
    });

    if (!solution) return false;

    // Update the new possible states
    solution.forEach((solTile, solX, solY) => {
      if (solTile.color === Color.Dark) {
        possibles[solY][solX].dark = true;
      } else {
        possibles[solY][solX].light = true;
      }
    });

    return true;
  }

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const tile = grid.getTile(x, y);

      if (!tile.exists || tile.color !== Color.Gray) continue;

      // We can skip this solve if it is proved to be solvable
      const darkPossible =
        possibles[y][x].dark || search(x, y, tile, Color.Dark);
      const lightPossible =
        possibles[y][x].light || search(x, y, tile, Color.Light);

      // No solution
      if (!darkPossible && !lightPossible) return null;

      if (darkPossible && !lightPossible)
        grid = grid.copyWith(
          {
            tiles: grid.setTile(x, y, tile.withColor(Color.Dark)),
          },
          false,
          false
        );
      if (!darkPossible && lightPossible)
        grid = grid.copyWith(
          {
            tiles: grid.setTile(x, y, tile.withColor(Color.Light)),
          },
          false,
          false
        );
    }
  }

  return grid;
}

function solve(
  grid: GridData,
  submitSolution: (grid: GridData | null) => boolean
) {
  if (grid.findRule(rule => rule.id === undercluedInstance.id)) {
    submitSolution(solveUnderclued(grid));
  } else {
    solveNormal(grid, submitSolution);
  }
}

onmessage = e => {
  const grid = Serializer.parseGrid(e.data as string);

  let count = 0;

  solve(grid, solution => {
    // if (solution) {
    //   if (solution.resetTiles().colorEquals(solution)) {
    //     solution = null;
    //   }
    // }
    postMessage(solution ? Serializer.stringifyGrid(solution) : null);

    count += 1;
    return count < 2;
  });

  postMessage(null);
};

export {};

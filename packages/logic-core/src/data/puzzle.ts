import { z } from 'zod';
import GridData from './grid.js';
import { Color, GridState, PuzzleType, State } from './primitives.js';

export type PuzzleMetadata = {
  /**
   * The title of the puzzle. (required)
   */
  title: string;
  /**
   * The author of the puzzle. (required)
   */
  author: string;
  /**
   * A description of the puzzle. (can be empty)
   */
  description: string;
  /**
   * The difficulty of the puzzle, from 0 to 10. (required)
   *
   * 0 represents an unrated puzzle, 6-10 represent star difficulties.
   */
  difficulty: number;
};

export const MetadataSchema = z.strictObject(
  {
    title: z.string('Title must be a string').min(1, 'Title must not be empty'),
    author: z
      .string('Author must be a string')
      .min(1, 'Author must not be empty'),
    description: z.string('Description must be a string'),
    difficulty: z
      .number('Difficulty must be a number')
      .int('Difficulty must be an integer')
      .min(0, 'Difficulty must be at least 0')
      .max(10, 'Difficulty must be at most 10'),
  },
  'Data must be an object'
);

export const PuzzleSchema = MetadataSchema.extend({
  grid: z.instanceof(GridData, { error: 'Grid must be a GridData instance' }),
  solution: z
    .instanceof(GridData, { error: 'Solution must be a GridData instance' })
    .nullable(),
}).strict();

export type PuzzleData = {
  /**
   * The grid of the puzzle. (required)
   *
   * You must fix all given cells in the grid. The rest of the cells will be cleared.
   */
  grid: GridData;
  /**
   * The solution to the puzzle. (optional)
   *
   * You should provide a solution if a rule requires it. Otherwise, the rule can never be satisfied.
   *
   * If there are no rules that require a solution, this field will be ignored.
   */
  solution: GridData | null;
};

export type Puzzle = PuzzleMetadata & PuzzleData;

/**
 * Checks if two puzzles are equal.
 */
export function puzzleEquals(a: Puzzle, b: Puzzle): boolean {
  return (
    a.title === b.title &&
    a.author === b.author &&
    a.description === b.description &&
    a.difficulty === b.difficulty &&
    a.grid.equals(b.grid) &&
    ((a.solution === null && b.solution === null) ||
      (!!a.solution && !!b.solution && a.solution.equals(b.solution)))
  );
}

/**
 * Get the types of a puzzle based on its grid properties. The returned types are ordered by their priority.
 * The first type is the most important one.
 */
export function getPuzzleTypes(grid: GridData): PuzzleType[] {
  const types: PuzzleType[] = [];
  let logic = true;
  if (grid.musicGrid.value) {
    types.push(PuzzleType.Music);
    logic = false;
  }
  if (grid.completePattern.value) {
    types.push(PuzzleType.Pattern);
    logic = false;
  }
  if (grid.underclued.value) {
    types.push(PuzzleType.Underclued);
  }
  if (logic) {
    types.push(PuzzleType.Logic);
  }
  return types;
}

export interface PuzzleChecklistItem {
  id: string;
  success: boolean;
  mandatory: boolean;
}

export interface PuzzleChecklist {
  items: PuzzleChecklistItem[];
  isValid: boolean;
}

export function validatePuzzleChecklist(
  metadata: PuzzleMetadata,
  gridWithSolution: GridData,
  state: GridState
): PuzzleChecklist {
  const checklist: PuzzleChecklist = {
    items: [],
    isValid: true,
  };
  checklist.items.push({
    id: 'metadataValid',
    success: MetadataSchema.safeParse(metadata).success,
    mandatory: true,
  });
  checklist.items.push({
    id: 'gridValid',
    success: gridWithSolution.width > 0 && gridWithSolution.height > 0,
    mandatory: true,
  });
  if (gridWithSolution.requireSolution()) {
    checklist.items.push({
      id: 'autoValidation',
      success: false,
      mandatory: false,
    });
    checklist.items.push({
      id: 'solutionIsNotEmpty',
      success: gridWithSolution.musicGrid.value
        ? gridWithSolution.tiles.some(row =>
            row.some(tile => !tile.fixed && tile.color === Color.Dark)
          )
        : gridWithSolution.tiles.some(row =>
            row.some(tile => !tile.fixed && tile.color !== Color.Gray)
          ),
      mandatory: true,
    });
  } else {
    checklist.items.push({
      id: 'autoValidation',
      success: true,
      mandatory: false,
    });
    checklist.items.push({
      id: 'solutionIsComplete',
      success: gridWithSolution.isComplete(),
      mandatory: true,
    });
    checklist.items.push({
      id: 'solutionIsValid',
      success: state.final !== State.Error,
      mandatory: true,
    });
  }
  checklist.isValid = !checklist.items.some(x => !x.success && x.mandatory);
  return checklist;
}

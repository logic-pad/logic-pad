import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { array } from '@logic-pad/core/data/dataHelper';
import { Puzzle, PuzzleData } from '@logic-pad/core/data/puzzle';
import { SolutionHandling } from './linkLoaderValidator';
import { PuzzleFull } from '../online/data';
import { useSuspenseQuery } from '@tanstack/react-query';

interface OnlineLinkLoaderResult {
  originalData: string;
  solutionStripped: boolean;
  puzzleId: string | null;
  initialPuzzle: Puzzle;
}

interface OnlineLinkLoaderParams {
  /**
   * Disables caching of the decoded puzzle
   */
  disableCache?: boolean;
  /**
   * Specifies how the solution should be loaded.
   */
  solutionHandling?: SolutionHandling;
  /**
   * Function to modify the loaded puzzle.
   */
  modifyPuzzle?: (puzzle: PuzzleData) => PuzzleData;
}

export default function useOnlineLinkLoader(
  id: string,
  puzzle: PuzzleFull,
  {
    disableCache = false,
    solutionHandling: solutionBehavior = SolutionHandling.LoadHidden,
    modifyPuzzle = puzzle => puzzle,
  }: OnlineLinkLoaderParams = {}
): OnlineLinkLoaderResult {
  const result = useSuspenseQuery({
    queryKey: ['puzzle', 'decode', puzzle.id, id],
    queryFn: async () => {
      const result = {
        originalData: puzzle.data,
        solutionStripped: false,
        puzzleId: puzzle.id,
      };
      let initialPuzzle: Puzzle;
      const decompressed = await Compressor.decompress(puzzle.data);
      const { grid, solution } = modifyPuzzle(
        Serializer.parseGridWithSolution(decompressed)
      );
      if (solutionBehavior === SolutionHandling.LoadVisible && solution) {
        const tiles = array(grid.width, grid.height, (x, y) => {
          const tile = grid.getTile(x, y);
          if (tile.fixed) return tile;
          return tile.withColor(solution.getTile(x, y).color);
        });
        const newGrid = grid.withTiles(tiles);
        initialPuzzle = {
          title: puzzle.title,
          author: puzzle.creator.name,
          description: puzzle.description,
          difficulty: puzzle.designDifficulty,
          grid: newGrid,
          solution: null,
        };
      } else if (solutionBehavior === SolutionHandling.LoadHidden) {
        initialPuzzle = {
          title: puzzle.title,
          author: puzzle.creator.name,
          description: puzzle.description,
          difficulty: puzzle.designDifficulty,
          grid,
          solution,
        };
      } else {
        result.solutionStripped = solution !== null && grid.requireSolution();
        initialPuzzle = {
          title: puzzle.title,
          author: puzzle.creator.name,
          description: puzzle.description,
          difficulty: puzzle.designDifficulty,
          grid,
          solution: null,
        };
      }
      return {
        ...result,
        initialPuzzle,
      };
    },
    gcTime: disableCache ? 0 : undefined,
    staleTime: disableCache ? 0 : undefined,
  });
  return result.data;
}

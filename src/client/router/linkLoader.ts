import { useLayoutEffect, useMemo } from 'react';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { NavigateOptions, useNavigate } from '@tanstack/react-router';
import { array } from '@logic-pad/core/data/dataHelper';
import { Puzzle } from '@logic-pad/core/data/puzzle';
import { defaultGrid } from '../contexts/GridContext';
import { useSuspenseQuery } from '@tanstack/react-query';
import { router } from './router';
import { PuzzleParams, SolutionHandling } from './linkLoaderValidator';

interface LinkLoaderResult {
  originalParams: PuzzleParams;
  solutionStripped: boolean;
  puzzleId: string | null;
  initialPuzzle: Puzzle;
  redirect?: NavigateOptions;
}

interface LinkLoaderParams {
  /**
   * Whether search params are removed after loading the puzzle.
   */
  cleanUrl?: boolean;
  /**
   * Specifies how the solution should be loaded.
   */
  solutionHandling?: SolutionHandling;
  /**
   * Whether to allow loading empty puzzles.
   */
  allowEmpty?: boolean;
  /**
   * Function to modify the loaded puzzle.
   */
  modifyPuzzle?: (puzzle: Puzzle) => Puzzle;
}

export default function useLinkLoader(
  id: string,
  {
    cleanUrl = false,
    solutionHandling: solutionBehavior = SolutionHandling.LoadHidden,
    allowEmpty = true,
    modifyPuzzle = puzzle => puzzle,
  }: LinkLoaderParams = {}
): LinkLoaderResult {
  const params = useMemo(() => router.state.location.search, []);
  const navigate = useNavigate();
  const result = useSuspenseQuery({
    queryKey: ['puzzle', 'decode-local', params, id],
    queryFn: async () => {
      const result = {
        originalParams: params,
        solutionStripped: false,
        puzzleId: null,
        redirect: undefined as NavigateOptions | undefined,
      };
      let initialPuzzle: Puzzle;
      if (params.d) {
        const behavior = params.loader ?? solutionBehavior;
        const decompressed = await Compressor.decompress(params.d);
        const { grid, solution, ...metadata } = modifyPuzzle(
          Serializer.parsePuzzle(decompressed)
        );
        if (behavior === SolutionHandling.LoadVisible && solution) {
          const tiles = array(grid.width, grid.height, (x, y) => {
            const tile = grid.getTile(x, y);
            if (tile.fixed) return tile;
            return tile.withColor(solution.getTile(x, y).color);
          });
          const newGrid = grid.withTiles(tiles);
          initialPuzzle = {
            ...metadata,
            grid: newGrid,
            solution: null,
          };
        } else if (behavior === SolutionHandling.LoadHidden) {
          initialPuzzle = {
            ...metadata,
            grid,
            solution,
          };
        } else {
          result.solutionStripped = solution !== null && grid.requireSolution();
          initialPuzzle = {
            ...metadata,
            grid,
            solution: null,
          };
        }
        if (cleanUrl) {
          result.redirect = { search: {}, ignoreBlocker: true };
        }
      } else {
        if (!allowEmpty) {
          result.redirect = { to: '/', ignoreBlocker: true };
        }
        initialPuzzle = {
          title: '',
          author: '',
          description: '',
          difficulty: 1,
          grid: defaultGrid,
          solution: null,
        };
      }
      return {
        ...result,
        initialPuzzle,
      };
    },
  });
  useLayoutEffect(() => {
    if (result.data.redirect) {
      void navigate(result.data.redirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return result.data;
}

import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  PublicPuzzleSearchParams,
  puzzleSearchSchema,
} from '../online/PuzzleSearchQuery';
import { queryClient } from '../online/api';
import { router } from '../router/router';
import toast from 'react-hot-toast';
import { searchPuzzlesInfiniteQueryOptions } from '../online/PuzzleSearchResults';

export const Route = createFileRoute('/_layout/search/puzzles')({
  validateSearch: zodValidator(puzzleSearchSchema),
  loader: async () => {
    try {
      await Promise.all([
        queryClient.ensureInfiniteQueryData(
          searchPuzzlesInfiniteQueryOptions(
            router.state.location.search as PublicPuzzleSearchParams
          )
        ),
      ]);
    } catch (error) {
      toast.error((error as Error).message);
      throw redirect({
        to: '/',
      });
    }
  },
  head: () => ({
    meta: [
      {
        title: `Search Puzzles - Logic Pad`,
      },
    ],
  }),
});

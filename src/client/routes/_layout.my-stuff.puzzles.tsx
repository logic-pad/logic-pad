import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  PrivatePuzzleSearchParams,
  privatePuzzleSearchSchema,
} from '../online/PuzzleSearchQuery';
import { queryClient } from '../online/api';
import { router } from '../router/router';
import toast from 'react-hot-toast';
import { searchOwnPuzzlesInfiniteQueryOptions } from '../online/PuzzleSearchResults';

export const Route = createFileRoute('/_layout/my-stuff/puzzles')({
  validateSearch: zodValidator(privatePuzzleSearchSchema),
  loader: async () => {
    try {
      await Promise.all([
        queryClient.ensureInfiniteQueryData(
          searchOwnPuzzlesInfiniteQueryOptions(
            router.state.location.search as PrivatePuzzleSearchParams
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
        title: `My Puzzles - Logic Pad`,
      },
    ],
  }),
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';
import { api, queryClient } from '../online/api';
import toast from 'react-hot-toast';

export const puzzleEditQueryOptions = (puzzleId: string | null) =>
  queryOptions({
    queryKey: ['puzzle', 'edit', puzzleId],
    queryFn: () => api.getPuzzleFullForEdit(puzzleId!),
    gcTime: 1000,
    staleTime: 1000,
    enabled: !!puzzleId,
  });

export const Route = createFileRoute('/_layout/create/$puzzleId')({
  remountDeps: ({ params }) => params.puzzleId,
  loader: async ({ params }) => {
    try {
      return await queryClient.ensureQueryData(
        puzzleEditQueryOptions(params.puzzleId)
      );
    } catch (error) {
      toast.error((error as Error).message);
      throw redirect({
        to: '/solve/$puzzleId',
        params: {
          puzzleId: params.puzzleId,
        },
      });
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title ?? 'Untitled'} - Puzzle Editor - Logic Pad`,
      },
    ],
  }),
});

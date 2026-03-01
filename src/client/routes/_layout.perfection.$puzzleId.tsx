import { createFileRoute, redirect } from '@tanstack/react-router';
import { queryClient } from '../online/api';
import toast from 'react-hot-toast';
import { puzzleSolveQueryOptions } from './_layout.solve.$puzzleId';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

export const Route = createFileRoute('/_layout/perfection/$puzzleId')({
  remountDeps: ({ params }) => params.puzzleId,
  validateSearch: zodValidator(
    z.object({
      collection: z.string().min(1).optional().catch(undefined),
    })
  ),
  loader: async ({ params }) => {
    try {
      return await queryClient.ensureQueryData(
        puzzleSolveQueryOptions(params.puzzleId)
      );
    } catch (error) {
      toast.error((error as Error).message);
      throw redirect({
        to: '/',
      });
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.title ?? 'Untitled'} - Logic Pad`,
      },
    ],
  }),
});

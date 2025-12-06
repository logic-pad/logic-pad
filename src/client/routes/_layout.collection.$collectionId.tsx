import { createFileRoute, redirect } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';
import { api, bidirectionalInfiniteQuery, queryClient } from '../online/api';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';

export const collectionQueryOptions = (collectionId: string) =>
  queryOptions({
    queryKey: ['collection', collectionId, 'info'],
    queryFn: () => api.getCollectionBrief(collectionId),
  });

export const collectionInfiniteQueryOptions = (
  collectionId: string,
  sort?: 'asc' | 'desc'
) =>
  bidirectionalInfiniteQuery(
    ['collection', collectionId, 'puzzles', sort],
    (cursorBefore, cursorAfter) =>
      api.listCollectionPuzzles(collectionId, sort, cursorBefore, cursorAfter)
  );

export const collectionSortSchema = z.object({
  sort: z.enum(['asc', 'desc']).optional().catch(undefined),
});

export const Route = createFileRoute('/_layout/collection/$collectionId')({
  validateSearch: zodValidator(collectionSortSchema),
  remountDeps: ({ params }) => params.collectionId,
  loaderDeps: ({ search: { sort } }) => ({ sort }),
  loader: async ({
    params,
    deps: { sort },
  }: {
    params: { collectionId: string };
    deps: { sort?: 'asc' | 'desc' };
  }) => {
    try {
      const collectionBrief = await queryClient.ensureQueryData(
        collectionQueryOptions(params.collectionId)
      );
      // we can render the page and suspend while waiting for this
      void queryClient.ensureInfiniteQueryData(
        collectionInfiniteQueryOptions(params.collectionId, sort)
      );
      return collectionBrief;
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

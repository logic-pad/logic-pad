import { createFileRoute, redirect } from '@tanstack/react-router';
import { api, bidirectionalInfiniteQuery, queryClient } from '../online/api';
import toast from 'react-hot-toast';
import {
  CollectionSearchParams,
  collectionSearchSchema,
} from '../online/CollectionSearchQuery';
import { zodValidator } from '@tanstack/zod-adapter';

export const followedCollectionsInfiniteQueryOptions = (
  search: CollectionSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['user', 'me', 'followed-collections', search],
    (cursorBefore, cursorAfter) =>
      api.listMyFollowedCollections(search, cursorBefore, cursorAfter)
  );

export const Route = createFileRoute('/_layout/my-follows')({
  validateSearch: zodValidator(collectionSearchSchema),
  loader: async () => {
    try {
      await Promise.all([
        queryClient.ensureInfiniteQueryData(
          followedCollectionsInfiniteQueryOptions({})
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
        title: `My Follows - Logic Pad`,
      },
    ],
  }),
});

import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import {
  CollectionSearchParams,
  collectionSearchSchema,
} from '../online/CollectionSearchQuery';
import { queryClient } from '../online/api';
import { router } from '../router/router';
import toast from 'react-hot-toast';
import { searchCollectionsInfiniteQueryOptions } from '../online/CollectionSearchResults';

export const Route = createFileRoute('/_layout/search/collections')({
  validateSearch: zodValidator(collectionSearchSchema),
  loader: async () => {
    try {
      await Promise.all([
        queryClient.ensureInfiniteQueryData(
          searchCollectionsInfiniteQueryOptions(
            router.state.location.search as CollectionSearchParams
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
        title: `Search Collections - Logic Pad`,
      },
    ],
  }),
});

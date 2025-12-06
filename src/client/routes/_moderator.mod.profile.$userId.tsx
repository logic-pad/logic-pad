import { createFileRoute, redirect } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';
import { api, queryClient } from '../online/api';
import toast from 'react-hot-toast';
import { userBriefQueryOptions } from './_layout.profile.$userId';

export const userAccountQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['profile', userId, 'account'],
    queryFn: () => api.modGetAccount(userId),
  });

export const userRestrictionsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['profile', userId, 'restrictions'],
    queryFn: () => api.modGetRestrictions(userId),
  });

export const Route = createFileRoute('/_moderator/mod/profile/$userId')({
  remountDeps: ({ params }) => params.userId,
  loader: async ({ params }) => {
    try {
      const userBrief = await queryClient.ensureQueryData(
        userBriefQueryOptions(params.userId)
      );
      // We can show the brief data immediately while loading the details
      void queryClient.ensureQueryData(userAccountQueryOptions(params.userId));
      void queryClient.ensureQueryData(
        userRestrictionsQueryOptions(params.userId)
      );
      return userBrief;
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
        title: `${loaderData?.name ?? 'User Profile'} - Mod View - Logic Pad`,
      },
    ],
  }),
});

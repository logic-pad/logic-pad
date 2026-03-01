import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { memo } from 'react';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import { useOnline } from '../contexts/OnlineContext';
import { api, queryClient } from './api';
import { RiUserFollowFill } from 'react-icons/ri';
import Skeleton from '../components/Skeleton';

const collectionFollowQueryOptions = (collectionId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ['collection', 'follow', collectionId],
    queryFn: () => api.getCollectionFollow(collectionId),
    enabled,
  });

export interface CollectionFollowButtonProps {
  collectionId: string;
}

export default memo(function CollectionFollowButton({
  collectionId,
}: CollectionFollowButtonProps) {
  const { isOnline, me } = useOnline();
  const collectionFollow = useQuery(
    collectionFollowQueryOptions(collectionId, isOnline && !!me)
  );
  const setCollectionFollow = useMutation({
    mutationKey: ['collection', 'follow', 'set', collectionId],
    mutationFn: (variables: Parameters<typeof api.setCollectionFollow>) => {
      return api.setCollectionFollow(...variables);
    },
    onMutate: async (variables: Parameters<typeof api.setCollectionFollow>) => {
      await queryClient.cancelQueries({
        queryKey: ['collection', 'follow', variables[0]],
      });
      const previousFollow = queryClient.getQueryData([
        'collection',
        'follow',
        variables[0],
      ])!;
      queryClient.setQueryData(['collection', 'follow', variables[0]], {
        followed: variables[1],
      });
      return { previousFollow };
    },
    onError(error, variables, context) {
      toast.error(error.message);
      if (context)
        queryClient.setQueryData(
          ['collection', 'follow', variables[0]],
          context.previousFollow
        );
    },
    onSettled(_data, _error, variables) {
      if (
        queryClient.isMutating({
          mutationKey: ['collection', 'follow', 'set', variables[0]],
        }) === 1
      )
        void queryClient.invalidateQueries({
          queryKey: ['collection', 'follow', variables[0]],
        });
    },
  });

  if (!isOnline || !me || collectionFollow.error) return null;
  if (collectionFollow.isPending) return <Skeleton className="h-10 w-28" />;
  return (
    <button
      className="tooltip tooltip-info tooltip-top btn btn-md btn-primary flex items-center w-fit focus:z-50"
      data-tip={
        collectionFollow.data.followed
          ? 'Unfollow this collection'
          : 'Follow this collection'
      }
      onClick={async () => {
        const newFollow = await setCollectionFollow.mutateAsync([
          collectionId,
          !collectionFollow.data.followed,
        ]);
        await queryClient.setQueryData(['puzzle', 'love', collectionId], {
          followed: newFollow.followed,
        });
        await queryClient.refetchQueries({
          queryKey: ['collection', collectionId, 'info'],
        });
      }}
    >
      {collectionFollow.data.followed ? (
        <RiUserFollowFill size={20} />
      ) : (
        <FaPlus size={20} />
      )}
      {collectionFollow.data.followed ? 'Following' : 'Follow'}
    </button>
  );
});

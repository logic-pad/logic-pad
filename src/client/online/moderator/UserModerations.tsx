import { useInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';
import Loading from '../../components/Loading';
import InfiniteScrollTrigger from '../../components/InfiniteScrollTrigger';
import { GivenModeration, ListResponse, ReceivedModeration } from '../data';
import { count, toRelativeDate } from '../../uiHelper';
import Skeleton from '../../components/Skeleton';
import { api, bidirectionalInfiniteQuery } from '../api';
import UserCard from '../../metadata/UserCard';

const UserModeration = memo(function UserModeration({
  moderation,
}: {
  moderation: ReceivedModeration | GivenModeration;
}) {
  return (
    <div className="flex flex-col items-start self-stretch gap-1 shrink-0">
      <div>{moderation.action}</div>
      <UserCard
        user={
          'moderator' in moderation ? moderation.moderator : moderation.user
        }
        className="badge-xs! badge-neutral!"
      />
      <div className="text-xs opacity-80 flex flex-wrap gap-2">
        <span>Created {toRelativeDate(new Date(moderation.createdAt))}</span>
        <span>Updated {toRelativeDate(new Date(moderation.updatedAt))}</span>
      </div>
      <pre className="text-xs whitespace-normal wrap-break-words">
        {moderation.description}
      </pre>
      {moderation.message !== null && (
        <div className="text-sm bg-base-300 rounded-sm w-full py-1 px-2 whitespace-normal wrap-break-words">
          {moderation.message}
        </div>
      )}
      <div className="divider my-0" />
    </div>
  );
});

export const modUserModerationsInfiniteQueryOptions = (
  userId: string,
  type: 'given' | 'received'
) =>
  bidirectionalInfiniteQuery(
    ['profile', userId, 'mod-moderations', type],
    (
      cursorBefore,
      cursorAfter
    ): Promise<ListResponse<ReceivedModeration | GivenModeration>> =>
      type === 'received'
        ? api.modListReceivedModerations(userId, cursorBefore, cursorAfter)
        : api.modListGivenModerations(userId, cursorBefore, cursorAfter)
  );

export interface UserModerationsProps {
  userId: string;
  type: 'given' | 'received';
}

export default memo(function UserModerations({
  userId,
  type,
}: UserModerationsProps) {
  const { data, isPending, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery(modUserModerationsInfiniteQueryOptions(userId, type));

  return (
    <div className="flex flex-col gap-4 w-[400px] max-w-full shrink-0">
      <h2 className="font-semibold text-xl shrink-0">
        <span className="capitalize">{type}</span> Moderations{' '}
        {data?.pages[0] && (
          <span className="badge badge-neutral">
            {count(data?.pages[0]?.total)}
          </span>
        )}
      </h2>
      <div className="flex-1 overflow-y-auto infinte-scroll">
        {isPending ? (
          <div className="flex flex-col gap-4 items-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="flex flex-col gap-2 w-full items-stretch" key={i}>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <div className="divider my-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            {data?.pages.flatMap(page =>
              page.results.map(collection => (
                <UserModeration key={collection.id} moderation={collection} />
              ))
            )}
            {isFetching ? (
              <Loading className="h-fit" />
            ) : hasNextPage ? (
              <InfiniteScrollTrigger
                onLoadMore={async () => await fetchNextPage()}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});

import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { memo, RefObject, useMemo } from 'react';
import Loading from '../../components/Loading';
import InfiniteScrollTrigger from '../../components/InfiniteScrollTrigger';
import { CollectionBrief, ResourceStatus } from '../data';
import { FaEyeSlash, FaListOl, FaUser } from 'react-icons/fa';
import { count, toRelativeDate } from '../../uiHelper';
import { CollectionSearchParams } from '../CollectionSearchQuery';
import { searchCollectionsInfiniteQueryOptions } from '../CollectionSearchResults';
import { TbLayoutGrid } from 'react-icons/tb';
import Skeleton from '../../components/Skeleton';
import { Link } from '@tanstack/react-router';
import { modPrompt, PromptHandle } from './ModMessagePrompt';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { api, queryClient } from '../api';
import toast from 'react-hot-toast';

const UserCollection = memo(function UserCollection({
  collection,
  promptHandle,
}: {
  collection: CollectionBrief;
  promptHandle: RefObject<PromptHandle | null>;
}) {
  const updateCollection = useMutation({
    mutationFn: (data: Parameters<typeof api.modUpdateCollection>) => {
      return api.modUpdateCollection(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['collection', 'search'],
      });
    },
  });
  const removeDescription = useMutation({
    mutationFn: (
      data: Parameters<typeof api.modRemoveCollectionDescription>
    ) => {
      return api.modRemoveCollectionDescription(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['collection', 'search'],
      });
    },
  });
  return (
    <div className="flex flex-col items-start self-stretch gap-1 shrink-0">
      <div className="w-full flex justify-between items-center gap-2">
        <Link
          to="/collection/$collectionId"
          params={{ collectionId: collection.id }}
          className="text-lg"
        >
          {collection.isSeries && (
            <FaListOl size={14} className="inline text-accent" />
          )}{' '}
          {collection.title.length === 0 ? (
            <span className="opacity-80">Untitled Collection</span>
          ) : (
            collection.title
          )}
        </Link>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-xs btn-ghost m-1">
            <BsThreeDotsVertical size={16} />
          </div>
          <ul
            tabIndex={-1}
            className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
          >
            <li>
              <a
                onClick={() =>
                  modPrompt(
                    promptHandle,
                    'Removing collection description. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      removeDescription.mutate([collection.id, message])
                    )
                    .catch(() => {})
                }
              >
                Remove description
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  modPrompt(
                    promptHandle,
                    'Unpublishing collection. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      updateCollection.mutate([
                        'unpublish',
                        collection.id,
                        message,
                      ])
                    )
                    .catch(() => {})
                }
              >
                Unpublish
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  modPrompt(
                    promptHandle,
                    'Deleting collection. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      updateCollection.mutate([
                        'delete',
                        collection.id,
                        message,
                      ])
                    )
                    .catch(() => {})
                }
              >
                Delete
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-xs opacity-80 flex flex-wrap gap-2">
        <span>Created {toRelativeDate(new Date(collection.createdAt))}</span>
        <span>Updated {toRelativeDate(new Date(collection.updatedAt))}</span>
      </div>
      <div className="flex gap-4 text-sm opacity-80">
        {collection.puzzleCount !== null && (
          <span className="flex items-center">
            <TbLayoutGrid className="me-2" /> {collection.puzzleCount}
          </span>
        )}
        {collection.status === ResourceStatus.Public ? (
          <span className="flex items-center">
            <FaUser className="me-2" /> {collection.followCount}
          </span>
        ) : (
          <span className="flex items-center">
            <FaEyeSlash className="me-2" />
            Private
          </span>
        )}
      </div>
      <div className="text-xs wrap-break-word">{collection.description}</div>
      <div className="divider my-0" />
    </div>
  );
});

export interface UserCollectionsProps {
  userId: string;
  promptHandle: RefObject<PromptHandle | null>;
}

export default memo(function UserCollections({
  userId,
  promptHandle,
}: UserCollectionsProps) {
  const searchParams = useMemo<CollectionSearchParams>(
    () => ({
      q: `creator=${userId}`,
      sort: 'updated-desc',
    }),
    [userId]
  );
  const { data, isPending, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery(searchCollectionsInfiniteQueryOptions(searchParams));

  return (
    <div className="flex flex-col gap-4 w-[400px] max-w-full shrink-0">
      <h2 className="font-semibold text-xl shrink-0">
        Collections{' '}
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
                <Skeleton className="h-20" />
                <div className="divider my-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            {data?.pages.flatMap(page =>
              page.results.map(collection => (
                <UserCollection
                  key={collection.id}
                  collection={collection}
                  promptHandle={promptHandle}
                />
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

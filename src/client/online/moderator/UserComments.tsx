import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { memo, RefObject } from 'react';
import Loading from '../../components/Loading';
import InfiniteScrollTrigger from '../../components/InfiniteScrollTrigger';
import { ModComment } from '../data';
import { FaReply } from 'react-icons/fa';
import { count, toRelativeDate } from '../../uiHelper';
import Skeleton from '../../components/Skeleton';
import { api, bidirectionalInfiniteQuery, queryClient } from '../api';
import Markdown from '../../components/Markdown';
import { Link } from '@tanstack/react-router';
import { modPrompt, PromptHandle } from './ModMessagePrompt';
import { BsThreeDotsVertical } from 'react-icons/bs';
import toast from 'react-hot-toast';

const UserComment = memo(function UserComment({
  comment,
  promptHandle,
}: {
  comment: ModComment;
  promptHandle: RefObject<PromptHandle | null>;
}) {
  const updateComment = useMutation({
    mutationFn: (data: Parameters<typeof api.modUpdateComment>) => {
      return api.modUpdateComment(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['profile', comment.creatorId, 'mod-comments'],
      });
    },
  });
  return (
    <div className="flex flex-col items-start self-stretch gap-1 shrink-0">
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex flex-col gap-1">
          <Link
            to="/solve/$puzzleId"
            params={{ puzzleId: comment.puzzle.id }}
            className="flex items-center gap-2 text-xs opacity-80"
          >
            <FaReply size={10} />
            <span>{comment.puzzle.title}</span>
          </Link>
          <div className="text-xs opacity-80 flex flex-wrap gap-2">
            <span>Created {toRelativeDate(new Date(comment.createdAt))}</span>
            <span>Updated {toRelativeDate(new Date(comment.updatedAt))}</span>
          </div>
        </div>
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
                    'Removing comment content. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      updateComment.mutate(['remove', comment.id, message])
                    )
                    .catch(() => {})
                }
              >
                Remove content
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  modPrompt(
                    promptHandle,
                    'Deleting comment. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      updateComment.mutate(['delete', comment.id, message])
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
      <Markdown className="wrap-break-word text-sm">{comment.content}</Markdown>
      <div className="divider my-0" />
    </div>
  );
});

export const modUserCommentsInfiniteQueryOptions = (userId: string) =>
  bidirectionalInfiniteQuery(
    ['profile', userId, 'mod-comments'],
    (cursorBefore, cursorAfter) =>
      api.modListComments(userId, cursorBefore, cursorAfter)
  );

export interface UserCommentsProps {
  userId: string;
  promptHandle: RefObject<PromptHandle | null>;
}

export default memo(function UserComments({
  userId,
  promptHandle,
}: UserCommentsProps) {
  const { data, isPending, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery(modUserCommentsInfiniteQueryOptions(userId));

  return (
    <div className="flex flex-col gap-4 w-[400px] max-w-full shrink-0">
      <h2 className="font-semibold text-xl shrink-0">
        Comments{' '}
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
                <Skeleton className="h-12" />
                <div className="divider my-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            {data?.pages.flatMap(page =>
              page.results.map(collection => (
                <UserComment
                  key={collection.id}
                  comment={collection}
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

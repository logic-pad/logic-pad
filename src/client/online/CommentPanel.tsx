import { memo, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { onlinePuzzleIdAtom } from '../state/onlinePuzzle.ts';
import {
  InfiniteData,
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
} from '@tanstack/react-query';
import { api, bidirectionalInfiniteQuery, queryClient } from './api';
import Loading from '../components/Loading';
import { Comment, ListResponse } from './data';
import { useOnline } from '../state/online.ts';
import toast from 'react-hot-toast';
import CommentEntry from './CommentEntry';
import CommentTextarea, { CommentTextareaRef } from './CommentTextarea';
import { IoArrowBack, IoSend } from 'react-icons/io5';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import { tip } from '../components/Tooltip.tsx';
import { cn } from '../uiHelper.ts';

export interface CommentPanelProps {
  onBack?: () => void;
  className?: string;
}

export const commentListQueryOptions = (puzzleId: string) =>
  infiniteQueryOptions({
    ...bidirectionalInfiniteQuery(
      ['puzzle', puzzleId, 'comments', 'list'],
      (cursorBefore, cursorAfter) =>
        api.listComments(puzzleId, cursorBefore, cursorAfter),
      false
    ),
  });

/**
 * Generic comment list for a puzzle. Designed to fill its parent container,
 * e.g. the left sidebar of the solve screen or a column in the editor.
 */
export default memo(function CommentPanel({
  onBack,
  className,
}: CommentPanelProps) {
  const { me } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const commentList = useInfiniteQuery({
    ...commentListQueryOptions(id!),
    enabled: !!id && !!me,
  });
  const addComment = useMutation({
    mutationKey: ['puzzle', id, 'comments', 'add'],
    mutationFn: (variables: Parameters<typeof api.createComment>) => {
      return api.createComment(...variables);
    },
    onMutate: async (variables: Parameters<typeof api.createComment>) => {
      await queryClient.cancelQueries({
        queryKey: ['puzzle', id, 'comments'],
      });
      const previousCount = queryClient.getQueryData<
        Pick<ListResponse<Comment>, 'total'>
      >(['puzzle', id, 'comments', 'count']);
      queryClient.setQueryData<Pick<ListResponse<Comment>, 'total'>>(
        ['puzzle', id, 'comments', 'count'],
        old => ({
          total: (old?.total ?? 0) + 1,
        })
      );
      const previousComments = queryClient.getQueryData<
        InfiniteData<ListResponse<Comment>>
      >(['puzzle', id, 'comments', 'list'])!;
      const optimisticId = Math.random().toString(36).substring(2, 9);
      queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
        ['puzzle', id, 'comments', 'list'],
        {
          pageParams: [undefined, ...previousComments.pageParams],
          pages: [
            {
              total: 1,
              results: [
                {
                  id: optimisticId,
                  content: variables[1],
                  puzzleId: id!,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  creator: me!,
                },
              ],
            },
            ...previousComments.pages,
          ],
        }
      );
      return { previousComments, optimisticId, previousCount };
    },
    onError(error, _variables, context) {
      toast.error(error.message);
      if (context) {
        queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
          ['puzzle', id, 'comments', 'list'],
          oldData => {
            if (oldData === undefined) return undefined;
            return {
              ...oldData,
              pages: oldData.pages.map(page => {
                const results = page.results.filter(
                  comment => comment.id !== context.optimisticId
                );
                return {
                  total: results.length,
                  results,
                };
              }),
            };
          }
        );
        queryClient.setQueryData<Pick<ListResponse<Comment>, 'total'>>(
          ['puzzle', id, 'comments', 'count'],
          context.previousCount
        );
      }
    },
    onSuccess(data, _variables, context) {
      queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
        ['puzzle', id, 'comments', 'list'],
        oldData => {
          if (oldData === undefined) return undefined;
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              results: page.results.map(result =>
                result.id === context?.optimisticId
                  ? { ...result, id: data.id }
                  : result
              ),
            })),
          };
        }
      );
    },
    async onSettled() {
      if (
        queryClient.isMutating({
          mutationKey: ['puzzle', id, 'comments', 'add'],
        }) === 1
      ) {
        await queryClient.invalidateQueries({
          queryKey: ['puzzle', id, 'comments'],
        });
      }
    },
  });
  const inputRef = useRef<CommentTextareaRef>(null);

  if (!id || !me) return null;

  return (
    <div
      className={cn(
        'h-full w-full flex flex-col items-center gap-4 bg-base-100 text-base-content',
        className
      )}
    >
      <div className="flex items-center gap-2 self-stretch shrink-0">
        {onBack && (
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={onBack}
            aria-label="Back"
          >
            <IoArrowBack size={20} />
          </button>
        )}
        <div className="text-accent text-sm uppercase">Comments</div>
      </div>
      {commentList.isPending ? (
        <Loading />
      ) : (
        <div className="self-stretch overflow-y-auto overflow-x-hidden flex-1 pr-2 flex flex-col-reverse scrollbar-thin *:shrink-0">
          {commentList.data?.pages.flatMap(page =>
            page.results.map(comment => (
              <CommentEntry
                key={comment.id}
                comment={comment}
                onReply={(name, id) => {
                  inputRef.current?.prependMention(name, id);
                  inputRef.current?.focus();
                }}
              />
            ))
          )}
          {commentList.isFetchingNextPage ? (
            <Loading className="h-4 p-4 self-center" />
          ) : commentList.hasNextPage ? (
            <InfiniteScrollTrigger
              onLoadMore={async () => await commentList.fetchNextPage()}
              direction="up"
              className="btn-sm w-fit self-center"
            />
          ) : null}
        </div>
      )}
      <div className="relative flex gap-2 items-center self-stretch shrink-0">
        <CommentTextarea
          ref={inputRef}
          onPostComment={text => addComment.mutate([id, text])}
        />
        <div className="shrink-0" {...tip('Send (enter)', 'left')}>
          <button
            className="btn btn-ghost btn-square btn-sm"
            onClick={() => inputRef.current?.sendComment()}
          >
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
});

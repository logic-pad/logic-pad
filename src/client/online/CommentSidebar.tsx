import { memo, useId, useRef } from 'react';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import {
  InfiniteData,
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
} from '@tanstack/react-query';
import { api, bidirectionalInfiniteQuery, queryClient } from './api';
import Loading from '../components/Loading';
import { Comment, ListResponse } from './data';
import { useOnline } from '../contexts/OnlineContext';
import toast from 'react-hot-toast';
import CommentEntry from './CommentEntry';
import CommentTextarea, { CommentTextareaRef } from './CommentTextarea';
import { IoSend } from 'react-icons/io5';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';

export interface CommentSidebarProps {
  open: boolean;
  onClose?: () => void;
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

export default memo(function CommentSidebar({
  open,
  onClose,
}: CommentSidebarProps) {
  const drawerId = useId();
  const { me } = useOnline();
  const { id } = useOnlinePuzzle();
  const commentList = useInfiniteQuery({
    ...commentListQueryOptions(id!),
    enabled: !!id && !!me && open,
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
    <div className="drawer drawer-end h-0 w-0">
      <input
        id={`comment-sidebar-${drawerId}`}
        type="checkbox"
        className="drawer-toggle"
        checked={open}
        readOnly
      />
      <div className="drawer-side overflow-x-visible! overflow-y-visible! z-50 h-full w-full">
        <label
          htmlFor={`comment-sidebar-${drawerId}`}
          aria-label="Close sidebar"
          className="drawer-overlay"
          onClick={onClose}
        ></label>
        <div className="h-full w-full pointer-events-none flex justify-end">
          {open && (
            <div className="h-full w-[360px] max-w-full shrink-0 grow-0 flex flex-col items-center pt-4 pb-2 gap-4 bg-neutral text-neutral-content self-stretch pointer-events-auto">
              <div className="text-accent text-sm uppercase self-start mx-4 shrink-0">
                Comments
              </div>
              {commentList.isPending ? (
                <Loading />
              ) : (
                <div className="self-stretch overflow-y-auto overflow-x-hidden flex-1 ms-4 pr-2 flex flex-col-reverse scrollbar-thin *:shrink-0">
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
                      className="btn-sm btn-neutral w-fit self-center"
                    />
                  ) : null}
                </div>
              )}
              <div className="relative flex gap-2 items-center self-stretch mx-2 shrink-0">
                <CommentTextarea
                  ref={inputRef}
                  onPostComment={text => addComment.mutate([id, text])}
                />
                <div
                  className="tooltip tooltip-info tooltip-left shrink-0"
                  data-tip="Send (enter)"
                >
                  <button
                    className="btn btn-ghost btn-square btn-sm"
                    onClick={() => inputRef.current?.sendComment()}
                  >
                    <IoSend />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

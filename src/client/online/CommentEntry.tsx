import { useMutation, InfiniteData } from '@tanstack/react-query';
import { memo, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaCheck, FaEdit, FaReply, FaTrash } from 'react-icons/fa';
import Markdown from '../components/Markdown';
import { useOnline } from '../contexts/OnlineContext';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import UserCard from '../metadata/UserCard';
import { toRelativeDate } from '../uiHelper';
import { api, queryClient } from './api';
import { Comment, ListResponse } from './data';
import CommentTextarea, { CommentTextareaRef } from './CommentTextarea';

export interface CommentEntryProps {
  comment: Comment;
  onReply?: (userName: string, userId: string) => void;
}

export default memo(function CommentEntry({
  comment,
  onReply,
}: CommentEntryProps) {
  const { me } = useOnline();
  const { id } = useOnlinePuzzle();
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<CommentTextareaRef>(null);
  const editable = !!me && me.id === comment.creator.id;

  const updateComment = useMutation({
    mutationKey: ['puzzle', id, 'comments', 'update'],
    mutationFn: (variables: Parameters<typeof api.updateComment>) => {
      return api.updateComment(...variables);
    },
    onMutate: async (variables: Parameters<typeof api.updateComment>) => {
      await queryClient.cancelQueries({
        queryKey: ['puzzle', id, 'comments', 'list'],
      });
      const previousContent = comment.content;
      queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
        ['puzzle', id, 'comments', 'list'],
        oldData => {
          if (oldData === undefined) return undefined;
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              return {
                total: page.results.length,
                results: page.results.map(result =>
                  result.id === comment.id
                    ? { ...result, content: variables[1] }
                    : result
                ),
              };
            }),
          };
        }
      );
      return { previousContent };
    },
    onError(error, _variables, context) {
      toast.error(error.message);
      if (context)
        queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
          ['puzzle', id, 'comments', 'list'],
          oldData => {
            if (oldData === undefined) return undefined;
            return {
              ...oldData,
              pages: oldData.pages.map(page => {
                return {
                  total: page.results.length,
                  results: page.results.map(result =>
                    result.id === comment.id
                      ? { ...result, content: context.previousContent }
                      : result
                  ),
                };
              }),
            };
          }
        );
    },
    async onSettled() {
      if (
        queryClient.isMutating({
          mutationKey: ['puzzle', id, 'comments', 'update'],
        }) === 1
      )
        await queryClient.invalidateQueries({
          queryKey: ['puzzle', id, 'comments', 'list'],
        });
    },
  });
  const deleteComment = useMutation({
    mutationKey: ['puzzle', id, 'comments', 'delete'],
    mutationFn: (variables: Parameters<typeof api.deleteComment>) => {
      return api.deleteComment(...variables);
    },
    onMutate: async (variables: Parameters<typeof api.deleteComment>) => {
      await queryClient.cancelQueries({
        queryKey: ['puzzle', id, 'comments'],
      });
      const previousCount = queryClient.getQueryData<
        Pick<ListResponse<Comment>, 'total'>
      >(['puzzle', id, 'comments', 'count']);
      queryClient.setQueryData<Pick<ListResponse<Comment>, 'total'>>(
        ['puzzle', id, 'comments', 'count'],
        old => ({
          total: (old?.total ?? 1) - 1,
        })
      );
      const previousComments = queryClient.getQueryData<
        InfiniteData<ListResponse<Comment>>
      >(['puzzle', id, 'comments', 'list'])!;
      queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
        ['puzzle', id, 'comments', 'list'],
        oldData => {
          if (oldData === undefined) return undefined;
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              return {
                total: page.results.length,
                results: page.results.filter(
                  result => result.id !== variables[0]
                ),
              };
            }),
          };
        }
      );
      return { previousComments, previousCount };
    },
    onError(error, _variables, context) {
      toast.error(error.message);
      if (context) {
        queryClient.setQueryData<InfiniteData<ListResponse<Comment>>>(
          ['puzzle', id, 'comments', 'list'],
          context.previousComments
        );
        queryClient.setQueryData<Pick<ListResponse<Comment>, 'total'>>(
          ['puzzle', id, 'comments', 'count'],
          context.previousCount
        );
      }
    },
    async onSettled() {
      if (
        queryClient.isMutating({
          mutationKey: ['puzzle', id, 'comments', 'delete'],
        }) === 1
      ) {
        await queryClient.invalidateQueries({
          queryKey: ['puzzle', id, 'comments'],
        });
      }
    },
  });

  return (
    <div className="relative flex flex-col gap-1 comment-entry">
      <div className="flex gap-2 items-center">
        <UserCard
          user={comment.creator}
          tooltip={false}
          className="badge-sm! py-2!"
        />
        <div className="text-sm opacity-80">
          {toRelativeDate(new Date(comment.createdAt))}
        </div>
        <button
          className="btn btn-square btn-sm btn-ghost"
          onClick={() => {
            onReply?.(comment.creator.name, comment.creator.id);
          }}
        >
          <FaReply />
        </button>
      </div>
      {editable && (
        <div className="absolute right-2 top-0 bg-base-100 shadow-md rounded-md flex gap-1 [.comment-entry:hover_&]:opacity-100 opacity-0 transition-opacity">
          <button
            className="btn btn-ghost btn-sm shrink-0 px-2"
            onClick={() => {
              if (editing) {
                inputRef.current?.sendComment();
              } else {
                setEditing(!editing);
              }
            }}
          >
            {editing ? <FaCheck /> : <FaEdit />}
          </button>
          <button
            className="btn btn-ghost btn-sm shrink-0 px-2 text-error"
            onClick={() => {
              deleteComment.mutate([comment.id]);
            }}
          >
            <FaTrash />
          </button>
        </div>
      )}
      {editable ? (
        <div className="self-stretch flex gap-1">
          {editing ? (
            <CommentTextarea
              ref={inputRef}
              defaultValue={comment.content}
              onPostComment={content => {
                if (editing && content !== comment.content) {
                  updateComment.mutate([comment.id, content]);
                }
                setEditing(!editing);
              }}
            />
          ) : (
            <Markdown className="flex-1 wrap-break-word prose-sm">
              {comment.content}
            </Markdown>
          )}
        </div>
      ) : (
        <Markdown className="wrap-break-word prose-sm">
          {comment.content}
        </Markdown>
      )}
      <div className="divider m-0 opacity-50" />
    </div>
  );
});

import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { memo, RefObject, useMemo } from 'react';
import { searchPuzzlesInfiniteQueryOptions } from '../PuzzleSearchResults';
import { PublicPuzzleSearchParams } from '../PuzzleSearchQuery';
import Loading from '../../components/Loading';
import InfiniteScrollTrigger from '../../components/InfiniteScrollTrigger';
import { PuzzleBrief, ResourceStatus } from '../data';
import { FaCheckSquare, FaEyeSlash, FaHeart, FaListOl } from 'react-icons/fa';
import Difficulty from '../../metadata/Difficulty';
import { count, toRelativeDate } from '../../uiHelper';
import Skeleton from '../../components/Skeleton';
import { medianFromHistogram } from '../../metadata/RatedDifficulty';
import { Link } from '@tanstack/react-router';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { modPrompt, PromptHandle } from './ModMessagePrompt';
import { api, queryClient } from '../api';
import toast from 'react-hot-toast';

const UserPuzzle = memo(function UserPuzzle({
  puzzle,
  promptHandle,
}: {
  puzzle: PuzzleBrief;
  promptHandle: RefObject<PromptHandle | null>;
}) {
  const updatePuzzle = useMutation({
    mutationFn: (data: Parameters<typeof api.modUpdatePuzzle>) => {
      return api.modUpdatePuzzle(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['profile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['puzzle', 'search'],
      });
    },
  });
  const removeDescription = useMutation({
    mutationFn: (data: Parameters<typeof api.modRemovePuzzleDescription>) => {
      return api.modRemovePuzzleDescription(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['puzzle', 'search'],
      });
    },
  });
  return (
    <div className="flex flex-col items-start self-stretch gap-1 shrink-0">
      <div className="w-full flex justify-between items-center gap-2">
        <Link
          to="/solve/$puzzleId"
          params={{ puzzleId: puzzle.id }}
          className="text-lg"
        >
          {puzzle.inSeries && (
            <FaListOl size={14} className="inline text-accent" />
          )}{' '}
          {puzzle.title.length === 0 ? (
            <span className="opacity-80">Untitled Puzzle</span>
          ) : (
            puzzle.title
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
                    'Removing puzzle description. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      removeDescription.mutate([puzzle.id, message])
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
                    'Unpublishing puzzle. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      updatePuzzle.mutate(['unpublish', puzzle.id, message])
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
                    'Deleting puzzle. Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                  )
                    .then(message =>
                      updatePuzzle.mutate(['delete', puzzle.id, message])
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
        <span>Created {toRelativeDate(new Date(puzzle.createdAt))}</span>
        <span>Updated {toRelativeDate(new Date(puzzle.updatedAt))}</span>
        {puzzle.publishedAt && (
          <span>Published {toRelativeDate(new Date(puzzle.publishedAt))}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span>
          {puzzle.width}&times;{puzzle.height}
        </span>
        <Difficulty value={puzzle.designDifficulty} size="sm" />
        <span>Rated:</span>
        <Difficulty
          value={medianFromHistogram(puzzle.ratedDifficulty)}
          size="sm"
        />
      </div>
      {puzzle.status === ResourceStatus.Public ? (
        <div className="flex gap-4 text-sm opacity-80">
          <span className="flex items-center">
            <FaCheckSquare className="me-2" /> {puzzle.solveCount}
          </span>
          <span className="flex items-center">
            <FaHeart className="me-2" /> {puzzle.loveCount}
          </span>
        </div>
      ) : (
        <div className="flex gap-4 text-sm opacity-80">
          <span className="flex items-center">
            <FaEyeSlash className="me-2" />
            Private
          </span>
        </div>
      )}
      <div className="text-xs wrap-break-word">{puzzle.description}</div>
      <div className="divider my-0" />
    </div>
  );
});

export interface UserPuzzlesProps {
  userId: string;
  promptHandle: RefObject<PromptHandle | null>;
}

export default memo(function UserPuzzles({
  userId,
  promptHandle,
}: UserPuzzlesProps) {
  const searchParams = useMemo<PublicPuzzleSearchParams>(
    () => ({
      q: `creator=${userId}`,
      sort: 'published-desc',
    }),
    [userId]
  );
  const { data, isPending, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery(searchPuzzlesInfiniteQueryOptions(searchParams));
  return (
    <div className="flex flex-col gap-4 w-[400px] max-w-full shrink-0">
      <h2 className="font-semibold text-xl shrink-0">
        Puzzles{' '}
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
              page.results.map(puzzle => (
                <UserPuzzle
                  key={puzzle.id}
                  puzzle={puzzle}
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

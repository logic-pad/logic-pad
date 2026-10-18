import React, { memo, useLayoutEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { onlinePuzzleAtom, onlinePuzzleIdAtom } from '../state/onlinePuzzle.ts';
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { api, PAGE_SIZE } from './api';
import { collectionQueryOptions } from '../routes/_layout.collection.$collectionId';
import Loading from '../components/Loading';
import { PuzzleIcon } from './PuzzleCard';
import { Link, useSearch } from '@tanstack/react-router';
import UserCard from '../metadata/UserCard';
import Difficulty from '../metadata/Difficulty';
import { cn } from '../uiHelper';
import { useOnline } from '../state/online.ts';
import { PuzzleBrief, ResourceStatus } from './data';
import { useSolveStatus } from './solveTracking/useSolveStatus.ts';
import { FaCheck } from 'react-icons/fa';
import { router } from '../router/router';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import { IoArrowBack } from 'react-icons/io5';
import toast from 'react-hot-toast';

/**
 * One page of the sidebar list. Unlike a plain `ListResponse`, a page knows
 * whether more puzzles remain on each side, because the initial page is a
 * window around the current puzzle rather than a contiguous slice.
 */
interface SidebarPage {
  total: number;
  results: PuzzleBrief[];
  hasPrevious: boolean;
  hasNext: boolean;
}

type SidebarPageParam = { cursorBefore?: string; cursorAfter?: string };

/** Fetching with no cursor means "the window around the current puzzle". */
const INITIAL_PAGE: SidebarPageParam = {};

export interface CollectionPanelProps {
  collectionId?: string | null;
  onBack?: () => void;
}

export function useResolvedCollectionId(collectionId?: string | null) {
  const puzzle = useAtomValue(onlinePuzzleAtom);
  const search = useSearch({ from: undefined, strict: false });
  return collectionId ?? search.collection ?? puzzle?.series?.id ?? null;
}

const CollectionPuzzleRow = memo(function CollectionPuzzleRow({
  puzzle,
  currentId,
  meId,
}: {
  puzzle: PuzzleBrief;
  currentId: string;
  meId: string | null;
}) {
  const { loaded, seen, solved } = useSolveStatus(puzzle.id);
  const unseen = loaded && !seen;
  const isCurrent = puzzle.id === currentId;
  return (
    <React.Fragment>
      <Link
        data-current={isCurrent ? 'true' : undefined}
        className={cn(
          'btn w-full h-fit flex flex-row flex-nowrap gap-2 py-2 items-center justify-start text-start wrapper relative',
          isCurrent ? '' : 'btn-ghost',
          puzzle.status === ResourceStatus.Private &&
            puzzle.creator.id !== meId &&
            'btn-disabled'
        )}
        to={
          puzzle.status === ResourceStatus.Private && puzzle.creator.id === meId
            ? '/create/$puzzleId'
            : '.'
        }
        params={{ puzzleId: puzzle.id }}
        search={{
          collection: router.state.location.search.collection,
        }}
      >
        <PuzzleIcon
          types={puzzle.types}
          size={36}
          className={cn(
            'shrink-0',
            isCurrent
              ? ''
              : 'bg-base-200! [.wrapper:hover_&]:bg-base-content/0! transition-colors [.wrapper:hover_&]:transition-none'
          )}
        />
        <div className="flex flex-col items-start gap-2">
          <h2 className="text-lg font-normal">
            {puzzle.title.length === 0 ? 'Untitled Puzzle' : puzzle.title}
          </h2>
          <div className="badge badge-md">{puzzle.creator.name}</div>
          <Difficulty value={puzzle.designDifficulty} size="sm" />
        </div>
        {unseen && (
          <span
            aria-hidden="true"
            className="absolute top-2 left-2 size-2.5 rounded-full bg-primary pointer-events-none"
          />
        )}
        {solved && (
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-2 text-base-content opacity-10 -rotate-12 pointer-events-none"
          >
            <FaCheck size={32} />
          </span>
        )}
      </Link>
      <div className="divider m-0" />
    </React.Fragment>
  );
});

/**
 * Generic puzzle list of a collection. Designed to fill its parent container,
 * e.g. the left sidebar of the solve screen, while keeping the puzzle area
 * interactive.
 */
export default memo(function CollectionPanel({
  collectionId: collectionIdProp,
  onBack,
}: CollectionPanelProps) {
  const { me } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const puzzle = useAtomValue(onlinePuzzleAtom);
  const collectionId = useResolvedCollectionId(collectionIdProp);
  const collection = useQuery({
    ...collectionQueryOptions(collectionId!),
    enabled: !!collectionId,
  });
  const queryKey = [
    'collection',
    collectionId,
    'puzzles',
    'sidebar',
    puzzle?.id,
  ] as const;
  const puzzleList = useInfiniteQuery<
    SidebarPage,
    Error,
    InfiniteData<SidebarPage, SidebarPageParam>,
    typeof queryKey,
    SidebarPageParam
  >({
    queryKey,
    initialPageParam: INITIAL_PAGE,
    enabled: !!collectionId && !!id,
    queryFn: async ({ pageParam }): Promise<SidebarPage> => {
      if (!pageParam.cursorBefore && !pageParam.cursorAfter) {
        const window = await api.listCollectionPuzzlesAround(
          collectionId!,
          id!
        );
        return {
          total: window.total,
          // The center puzzle is not part of the window response, so splice it
          // back in at its position.
          results: [...window.before, puzzle!, ...window.after],
          hasPrevious: window.before.length === PAGE_SIZE,
          hasNext: window.after.length === PAGE_SIZE,
        };
      }
      const page = await api.listCollectionPuzzles(
        collectionId!,
        undefined,
        pageParam.cursorBefore,
        pageParam.cursorAfter
      );
      return {
        total: page.total,
        results: page.results,
        hasPrevious: page.results.length === PAGE_SIZE,
        hasNext: page.results.length === PAGE_SIZE,
      };
    },
    getPreviousPageParam: firstPage =>
      firstPage.hasPrevious && firstPage.results.length > 0
        ? { cursorBefore: firstPage.results[0].id }
        : undefined,
    getNextPageParam: lastPage =>
      lastPage.hasNext && lastPage.results.length > 0
        ? { cursorAfter: lastPage.results[lastPage.results.length - 1].id }
        : undefined,
    staleTime: 1000 * 60,
    retry: false,
    throwOnError(error) {
      toast.error(error.message);
      return false;
    },
  });

  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const anchoredTop = useRef<number | null>(null);

  useLayoutEffect(() => {
    anchoredTop.current = null;
  }, [collectionId, id]);

  // Runs after every render: if rows were inserted above the current puzzle
  // (the window landing, or a "load more" prepend), scroll by the same amount
  // so the current puzzle keeps its on-screen position.
  useLayoutEffect(() => {
    const box = scrollBoxRef.current;
    const row = box?.querySelector<HTMLElement>('[data-current="true"]');
    if (!box || !row) return;
    const top =
      row.getBoundingClientRect().top -
      box.getBoundingClientRect().top +
      box.scrollTop;
    const previous = anchoredTop.current;
    if (previous !== null && top !== previous) {
      box.scrollTop += top - previous;
    }
    anchoredTop.current = top;
  });

  if (!id || !puzzle || !collectionId) return null;

  if (collection.isPending) return <Loading className="h-8" />;
  if (!collection.data) return null;

  // While the window is in flight, show the current puzzle alone rather than
  // an empty list, so the row never disappears and reappears.
  const rows = puzzleList.data?.pages.flatMap(page => page.results) ?? [puzzle];

  return (
    <div className="h-full w-full flex flex-col items-center gap-4 bg-base-100 text-base-content">
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
        <div className="text-accent text-sm uppercase">
          {puzzle.series && puzzle.series.id === collectionId
            ? 'Puzzle series'
            : 'Collection'}
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start w-full shrink-0">
        <Link
          to="/collection/$collectionId"
          params={{ collectionId }}
          className="btn btn-ghost flex flex-col flex-nowrap gap-2 items-start text-start *:shrink-0 h-fit w-full px-2 -mx-2"
        >
          <div className="text-2xl">{collection.data.title}</div>
        </Link>
        <UserCard user={collection.data.creator} />
        <div className="max-h-72 overflow-y-auto">
          {collection.data.description}
        </div>
      </div>
      <div className="divider m-0 shrink-0" />
      <div
        ref={scrollBoxRef}
        className="flex flex-col items-center w-full overflow-y-auto flex-1 *:shrink-0"
      >
        {puzzleList.isFetchingPreviousPage ? (
          <Loading className="h-4 m-4 shrink-0" />
        ) : puzzleList.hasPreviousPage ? (
          <InfiniteScrollTrigger
            onLoadMore={async () => await puzzleList.fetchPreviousPage()}
            autoTrigger={false}
            direction="up"
            className="btn-sm w-fit"
          />
        ) : null}
        {rows.map(puzzle => (
          <CollectionPuzzleRow
            key={puzzle.id}
            puzzle={puzzle}
            currentId={id}
            meId={me?.id ?? null}
          />
        ))}
        {!puzzleList.data || puzzleList.isFetchingNextPage ? (
          <Loading className="h-4 m-4 shrink-0" />
        ) : puzzleList.hasNextPage ? (
          <InfiniteScrollTrigger
            onLoadMore={async () => await puzzleList.fetchNextPage()}
            className="btn-sm w-fit"
          />
        ) : null}
      </div>
    </div>
  );
});

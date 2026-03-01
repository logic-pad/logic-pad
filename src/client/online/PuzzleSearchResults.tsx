import { ReactNode } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Loading from '../components/Loading';
import PuzzleCard from './PuzzleCard';
import {
  PrivatePuzzleSearchParams,
  PublicPuzzleSearchParams,
  PuzzleSearchParams,
  SearchType,
} from './PuzzleSearchQuery';
import { PuzzleBrief } from './data';
import { bidirectionalInfiniteQuery, api } from './api';
import { ToOptions } from '@tanstack/react-router';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';

export const searchPuzzlesInfiniteQueryOptions = (
  search: PublicPuzzleSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['puzzle', 'search', search],
    (cursorBefore, cursorAfter) =>
      api.searchPuzzles(search, cursorBefore, cursorAfter)
  );

export const searchOwnPuzzlesInfiniteQueryOptions = (
  search: PrivatePuzzleSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['puzzle', 'search-own', search],
    (cursorBefore, cursorAfter) =>
      api.searchMyPuzzles(search, cursorBefore, cursorAfter)
  );

export const searchPublishedPuzzlesInfiniteQueryOptions = (
  search: PublicPuzzleSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['puzzle', 'search-published', search],
    (cursorBefore, cursorAfter) =>
      api.searchPublishedPuzzles(search, cursorBefore, cursorAfter)
  );

export const searchAllPuzzlesInfiniteQueryOptions = (
  search: PrivatePuzzleSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['puzzle', 'search-all', search],
    (cursorBefore, cursorAfter) =>
      api.searchAllPuzzles(search, cursorBefore, cursorAfter)
  );

export interface PuzzleSearchResultsProps<Search extends SearchType> {
  params: PuzzleSearchParams<Search>;
  searchType: Search;
  to?: (puzzle: PuzzleBrief) => ToOptions;
  onClick?: (puzzle: PuzzleBrief) => void;
  puzzleCardChildren?: (puzzle: PuzzleBrief) => ReactNode;
}

export default function PuzzleSearchResults<Search extends SearchType>({
  params,
  searchType,
  to,
  onClick,
  puzzleCardChildren,
}: PuzzleSearchResultsProps<Search>) {
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
    searchType === 'public'
      ? (searchPuzzlesInfiniteQueryOptions(
          params as PublicPuzzleSearchParams
        ) as ReturnType<typeof searchOwnPuzzlesInfiniteQueryOptions>) // note: inaccurate page params type
      : searchType === 'published'
        ? (searchPublishedPuzzlesInfiniteQueryOptions(
            params as PublicPuzzleSearchParams
          ) as ReturnType<typeof searchOwnPuzzlesInfiniteQueryOptions>) // note: inaccurate page params type
        : searchType === 'own'
          ? searchOwnPuzzlesInfiniteQueryOptions(
              params as PrivatePuzzleSearchParams
            )
          : searchAllPuzzlesInfiniteQueryOptions(
              params as PrivatePuzzleSearchParams
            )
  );

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex flex-wrap gap-4 justify-center">
        {data?.pages.flatMap(page =>
          page.results.map(puzzle => (
            <PuzzleCard
              key={puzzle.id}
              puzzle={puzzle}
              onClick={() => onClick?.(puzzle)}
              {...to?.(puzzle)}
            >
              {puzzleCardChildren?.(puzzle)}
            </PuzzleCard>
          ))
        )}
      </div>
      {isFetching ? (
        <Loading className="h-fit" />
      ) : hasNextPage ? (
        <InfiniteScrollTrigger onLoadMore={async () => await fetchNextPage()} />
      ) : null}
    </div>
  );
}

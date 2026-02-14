import { memo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Loading from '../components/Loading';
import { CollectionSearchParams } from './CollectionSearchQuery';
import CollectionCard from './CollectionCard';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import { api, bidirectionalInfiniteQuery } from './api';
import { SearchType } from './PuzzleSearchQuery';

export const searchCollectionsInfiniteQueryOptions = (
  search: CollectionSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['collection', 'search', search],
    (cursorBefore, cursorAfter) =>
      api.searchCollections(search, cursorBefore, cursorAfter)
  );

export const searchOwnCollectionsInfiniteQueryOptions = (
  search: CollectionSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['collection', 'search-own', search],
    (cursorBefore, cursorAfter) =>
      api.searchMyCollections(search, cursorBefore, cursorAfter)
  );

export const searchPublishedCollectionsInfiniteQueryOptions = (
  search: CollectionSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['collection', 'search-published', search],
    (cursorBefore, cursorAfter) =>
      api.searchPublishedCollections(search, cursorBefore, cursorAfter)
  );

export const searchAllCollectionsInfiniteQueryOptions = (
  search: CollectionSearchParams
) =>
  bidirectionalInfiniteQuery(
    ['collection', 'search-all', search],
    (cursorBefore, cursorAfter) =>
      api.searchAllCollections(search, cursorBefore, cursorAfter)
  );

export interface CollectionSearchResultsProps {
  params: CollectionSearchParams;
  searchType: SearchType;
}

export default memo(function CollectionSearchResults({
  params,
  searchType,
}: CollectionSearchResultsProps) {
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
    searchType === 'public'
      ? searchCollectionsInfiniteQueryOptions(params)
      : searchType === 'own'
        ? searchOwnCollectionsInfiniteQueryOptions(params)
        : searchType === 'published'
          ? searchPublishedCollectionsInfiniteQueryOptions(params)
          : searchAllCollectionsInfiniteQueryOptions(params)
  );

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex flex-wrap gap-4 justify-center">
        {data?.pages.flatMap(page =>
          page.results.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              to="/collection/$collectionId"
              params={{ collectionId: collection.id }}
            />
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
});

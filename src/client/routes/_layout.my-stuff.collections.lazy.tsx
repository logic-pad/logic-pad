import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { memo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Loading from '../components/Loading';
import { useRouteProtection } from '../router/useRouteProtection';
import CollectionSearchQuery from '../online/CollectionSearchQuery';
import CollectionCard from '../online/CollectionCard';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import { searchOwnCollectionsInfiniteQueryOptions } from '../online/CollectionSearchResults';

export const Route = createLazyFileRoute('/_layout/my-stuff/collections')({
  component: memo(function MyStuff() {
    useRouteProtection('login');
    const navigate = Route.useNavigate();
    const search = Route.useSearch();
    const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
      searchOwnCollectionsInfiniteQueryOptions(search)
    );

    return (
      <>
        <div role="tablist" className="tabs tabs-lg tabs-border">
          <Link
            to="/my-stuff/puzzles"
            role="tab"
            className="tab text-neutral-content"
          >
            Puzzles
          </Link>
          <Link
            to="/my-stuff/collections"
            role="tab"
            className="tab tab-active text-neutral-content"
          >
            Collections
          </Link>
        </div>
        <CollectionSearchQuery
          params={search}
          onChange={async params => await navigate({ search: params })}
        />
        <div className="divider m-0" />
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
            <InfiniteScrollTrigger
              onLoadMore={async () => await fetchNextPage()}
            />
          ) : null}
        </div>
      </>
    );
  }),
});

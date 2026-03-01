import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { memo } from 'react';
import { useRouteProtection } from '../router/useRouteProtection';
import CollectionSearchQuery from '../online/CollectionSearchQuery';
import CollectionSearchResults from '../online/CollectionSearchResults';

export const Route = createLazyFileRoute('/_layout/search/collections')({
  component: memo(function Home() {
    useRouteProtection('online');
    const navigate = Route.useNavigate();
    const search = Route.useSearch();

    return (
      <>
        <div role="tablist" className="tabs tabs-lg tabs-border">
          <Link
            to="/search/puzzles"
            role="tab"
            className="tab text-neutral-content"
          >
            Puzzles
          </Link>
          <Link
            to="/search/collections"
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
        <CollectionSearchResults params={search} searchType="public" />
      </>
    );
  }),
});

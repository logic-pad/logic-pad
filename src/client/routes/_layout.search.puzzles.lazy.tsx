import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { memo } from 'react';
import PuzzleSearchResults from '../online/PuzzleSearchResults';
import PuzzleSearchQuery from '../online/PuzzleSearchQuery';
import { useRouteProtection } from '../router/useRouteProtection';

export const Route = createLazyFileRoute('/_layout/search/puzzles')({
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
            className="tab tab-active text-neutral-content"
          >
            Puzzles
          </Link>
          <Link
            to="/search/collections"
            role="tab"
            className="tab text-neutral-content"
          >
            Collections
          </Link>
        </div>
        <PuzzleSearchQuery
          params={search}
          searchType="public"
          onChange={async params => await navigate({ search: params })}
        />
        <div className="divider m-0" />
        <PuzzleSearchResults
          params={search}
          searchType="public"
          to={puzzle => ({
            to: '/solve/$puzzleId',
            params: { puzzleId: puzzle.id },
          })}
        />
      </>
    );
  }),
});

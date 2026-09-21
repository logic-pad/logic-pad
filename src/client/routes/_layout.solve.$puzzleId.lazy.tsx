import { createLazyFileRoute } from '@tanstack/react-router';
import { memo } from 'react';
import SolveScreen from '../screens/SolveScreen';
import PerfectionModeButton from '../components/quickActions/PerfectionModeButton';
import { useSuspenseQuery } from '@tanstack/react-query';
import useOnlineLinkLoader from '../router/onlineLinkLoader';
import { puzzleSolveQueryOptions } from './_layout.solve.$puzzleId';
import { useRouteProtection } from '../router/useRouteProtection';
import CollectionSidebar from '../online/CollectionButton';
import { PuzzleScope } from '../state/scopes/PuzzleScope';

export const Route = createLazyFileRoute('/_layout/solve/$puzzleId')({
  component: memo(function OnlineSolveMode() {
    useRouteProtection('online');
    const search = Route.useSearch();
    const { data } = useSuspenseQuery(
      puzzleSolveQueryOptions(Route.useParams().puzzleId)
    );
    const result = useOnlineLinkLoader('solve-online', data);
    return (
      <PuzzleScope
        puzzleId={result.puzzleId}
        puzzle={data}
        initialPuzzle={result.initialPuzzle}
      >
        <SolveScreen
          quickActions={[<PerfectionModeButton key="-perfectionModeButton" />]}
          topLeft={<CollectionSidebar collectionId={search.collection} />}
        />
      </PuzzleScope>
    );
  }),
});

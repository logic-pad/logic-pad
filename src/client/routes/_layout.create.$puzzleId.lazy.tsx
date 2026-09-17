import { createLazyFileRoute } from '@tanstack/react-router';
import { memo } from 'react';
import PuzzleEditorScreen from '../screens/PuzzleEditorScreen';
import { useSuspenseQuery } from '@tanstack/react-query';
import { puzzleEditQueryOptions } from './_layout.create.$puzzleId';
import useOnlineLinkLoader from '../router/onlineLinkLoader';
import { SolutionHandling } from '../router/linkLoaderValidator';
import { PuzzleScope } from '../state/scopes.tsx';
import ExitBlocker from '../router/ExitBlocker';
import { useRouteProtection } from '../router/useRouteProtection';

export const Route = createLazyFileRoute('/_layout/create/$puzzleId')({
  component: memo(function OnlineCreateMode() {
    useRouteProtection('login');
    const { data } = useSuspenseQuery(
      puzzleEditQueryOptions(Route.useParams().puzzleId)
    );
    const result = useOnlineLinkLoader('create-online', data, {
      disableCache: true,
      solutionHandling: SolutionHandling.LoadVisible,
    });

    return (
      <PuzzleScope
        puzzleId={result.puzzleId}
        puzzle={data}
        initialPuzzle={result.initialPuzzle}
      >
        <PuzzleEditorScreen>
          <ExitBlocker />
        </PuzzleEditorScreen>
      </PuzzleScope>
    );
  }),
});

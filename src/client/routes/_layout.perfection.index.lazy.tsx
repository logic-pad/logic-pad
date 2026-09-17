import { createLazyFileRoute } from '@tanstack/react-router';
import { memo } from 'react';
import useLinkLoader from '../router/linkLoader';
import PerfectionRule from '@logic-pad/core/data/rules/perfectionRule';
import PerfectionScreen from '../screens/PerfectionScreen';
import { instance as foresightInstance } from '@logic-pad/core/data/rules/foresightRule';
import { PuzzleScope } from '../state/scopes.tsx';
import SolvePathScope from '../state/solvePath.tsx';
import SolveModeButton from '../components/quickActions/SolveModeButton';

export const Route = createLazyFileRoute('/_layout/perfection/')({
  component: memo(function PerfectionMode() {
    const result = useLinkLoader('perfection-offline', {
      allowEmpty: false,
      modifyPuzzle: puzzle => {
        puzzle.grid = puzzle.grid.withRules(rules => [
          new PerfectionRule(),
          ...rules.filter(r => r.id !== foresightInstance.id),
        ]);
        puzzle.solution =
          puzzle.solution?.withRules(rules => [
            new PerfectionRule(),
            ...rules.filter(r => r.id !== foresightInstance.id),
          ]) ?? null;
        return puzzle;
      },
    });

    return (
      <PuzzleScope
        puzzleId={result.puzzleId}
        puzzle={null}
        initialPuzzle={result.initialPuzzle}
      >
        <SolvePathScope>
          <PerfectionScreen
            quickActions={[<SolveModeButton key="solveModeButton" />]}
          />
        </SolvePathScope>
      </PuzzleScope>
    );
  }),
});

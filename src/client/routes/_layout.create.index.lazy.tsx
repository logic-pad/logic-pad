import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { memo } from 'react';
import { SolutionHandling } from '../router/linkLoaderValidator';
import useLinkLoader from '../router/linkLoader';
import PuzzleEditorScreen from '../screens/PuzzleEditorScreen';
import { IoWarningOutline } from 'react-icons/io5';
import MainContext from '../router/MainContext';
import ExitBlocker from '../router/ExitBlocker';

export const Route = createLazyFileRoute('/_layout/create/')({
  component: memo(function CreateMode() {
    const navigate = useNavigate();
    const result = useLinkLoader('create-offline', {
      cleanUrl: true,
      solutionHandling: SolutionHandling.Remove,
    });

    return (
      <MainContext
        initialPuzzle={result.initialPuzzle}
        puzzle={null}
        puzzleId={result.puzzleId}
      >
        <PuzzleEditorScreen>
          <ExitBlocker />
          {result && result.solutionStripped && (
            <div
              className="tooltip tooltip-top tooltip-info flex shrink-0"
              data-tip="The puzzle solution has been removed to avoid spoiling the puzzle. Click to reload the puzzle with its original solution."
            >
              <div role="alert" className="alert shadow-lg gap-2">
                <IoWarningOutline className="text-warning" size={24} />
                <div>
                  <h3 className="font-bold">Solution removed</h3>
                  <div className="text-xs">Click to load original puzzle</div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-warning"
                  onClick={() =>
                    navigate({
                      to: '/solve',
                      search: result.originalParams,
                    })
                  }
                >
                  Load
                </button>
              </div>
            </div>
          )}
        </PuzzleEditorScreen>
      </MainContext>
    );
  }),
});

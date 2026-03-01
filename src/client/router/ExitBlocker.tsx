import { Compressor, puzzleEquals, Serializer } from '@logic-pad/core/index';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { memo, useEffect, useState } from 'react';
import { defaultGrid, useGrid } from '../contexts/GridContext';
import { useSettings } from '../contexts/SettingsContext';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import { SolutionHandling } from './linkLoaderValidator';

export default memo(function ExitBlocker() {
  const [enableExitConfirmation] = useSettings('enableExitConfirmation');
  const [willUpdate, setWillUpdate] = useState(false);
  const { metadata, grid, solution } = useGrid();
  const { lastSaved } = useOnlinePuzzle();
  const navigate = useNavigate();

  useEffect(() => {
    const broadcast = new BroadcastChannel('prepareForUpdate');
    broadcast.addEventListener('message', () => {
      setWillUpdate(true);
      void (async () => {
        await navigate({
          to: '.',
          search: grid.equals(defaultGrid)
            ? {}
            : {
                d: await Compressor.compress(
                  Serializer.stringifyPuzzle({
                    ...metadata,
                    grid,
                    solution,
                  })
                ),
                loader:
                  solution === null ? SolutionHandling.LoadVisible : undefined,
              },
          ignoreBlocker: true,
          replace: true,
        });
      })();
    });
    return () => {
      broadcast.close();
    };
  }, [grid, metadata, navigate, solution]);

  useBlocker({
    shouldBlockFn: () => {
      if (
        willUpdate ||
        !enableExitConfirmation ||
        puzzleEquals(lastSaved, { ...metadata, grid, solution: null })
      ) {
        return false;
      }
      return !window.confirm(
        'There are unsaved changes. Are you sure you want to leave?'
      );
    },
    disabled:
      willUpdate ||
      !enableExitConfirmation ||
      puzzleEquals(lastSaved, { ...metadata, grid, solution: null }),
  });
  return null;
});

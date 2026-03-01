import { Puzzle } from '@logic-pad/core/data/puzzle';
import React, { memo, useMemo } from 'react';
import DisplayContext from '../contexts/DisplayContext';
import EditContext from '../contexts/EditContext';
import EmbedContext from '../contexts/EmbedContext';
import GridContext from '../contexts/GridContext';
import GridStateContext from '../contexts/GridStateContext';
import InstructionPartsContext from '../contexts/InstructionPartsContext';
import OnlinePuzzleContext from '../contexts/OnlinePuzzleContext';
import SolverContext from '../contexts/SolverContext';
import { PuzzleFull } from '../online/data';

export interface MainContextProps {
  puzzleId: string | null;
  puzzle: PuzzleFull | null;
  initialPuzzle: Puzzle;
  children: React.ReactNode;
}

export default memo(function MainContext({
  puzzleId,
  puzzle,
  initialPuzzle,
  children,
}: MainContextProps) {
  const props = useMemo(() => {
    const { grid, solution, ...metadata } = initialPuzzle;
    return { grid, solution, metadata };
  }, [initialPuzzle]);
  return (
    <EmbedContext name="root">
      <OnlinePuzzleContext
        id={puzzleId}
        puzzle={puzzle}
        initialPuzzle={initialPuzzle}
      >
        <DisplayContext>
          <EditContext initialGrid={props.grid}>
            <GridStateContext>
              <GridContext
                initialGrid={props.grid}
                initialSolution={props.solution}
                initialMetadata={props.metadata}
              >
                <SolverContext>
                  <InstructionPartsContext>{children}</InstructionPartsContext>
                </SolverContext>
              </GridContext>
            </GridStateContext>
          </EditContext>
        </DisplayContext>
      </OnlinePuzzleContext>
    </EmbedContext>
  );
});

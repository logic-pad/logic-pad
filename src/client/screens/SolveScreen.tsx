import { Mode } from '@logic-pad/core/data/primitives';
import { SolveGridControls } from '../components/GridControlsBar';
import React, { memo } from 'react';
import PuzzlePlayScreen from './PuzzlePlayScreen';

export interface SolveScreenProps {
  quickActions?: React.ReactNode;
  children?: React.ReactNode;
  topLeft?: React.ReactNode;
}

export default memo(function SolveScreen({
  quickActions,
  children,
  topLeft,
}: SolveScreenProps) {
  return (
    <PuzzlePlayScreen
      controls={<SolveGridControls />}
      mode={Mode.Solve}
      quickActions={quickActions}
      topLeft={topLeft}
    >
      {children}
    </PuzzlePlayScreen>
  );
});

import { PerfectionGridControls } from '../components/GridControlsBar';
import { Mode } from '@logic-pad/core/data/primitives';
import React, { memo } from 'react';
import PuzzlePlayScreen from './PuzzlePlayScreen';

export interface PerfectionScreenProps {
  quickActions?: React.ReactNode;
  children?: React.ReactNode;
  topLeft?: React.ReactNode;
  onReset?: () => void;
}

export default memo(function PerfectionScreen({
  quickActions,
  children,
  topLeft,
  onReset,
}: PerfectionScreenProps) {
  return (
    <PuzzlePlayScreen
      controls={<PerfectionGridControls onReset={onReset} />}
      mode={Mode.Perfection}
      quickActions={quickActions}
      topLeft={topLeft}
    >
      {children}
    </PuzzlePlayScreen>
  );
});

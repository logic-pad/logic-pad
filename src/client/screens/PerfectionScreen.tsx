import { PerfectionEditControls } from '../components/EditControls';
import ThreePaneLayout from '../components/ThreePaneLayout';
import TouchControls from '../components/TouchControls';
import { GridConsumer } from '../contexts/GridContext';
import SolvePathContext from '../contexts/SolvePathContext';
import MainGrid from '../grid/MainGrid';
import InstructionList from '../instructions/InstructionList';
import InstructionPartOutlet from '../instructions/InstructionPartOutlet';
import { PartPlacement } from '../instructions/parts/types';
import Metadata from '../metadata/Metadata';
import { Mode, Position } from '@logic-pad/core/data/primitives';
import ModeVariantLoader from '../router/ModeVariantLoader';
import React, { lazy, memo, Suspense } from 'react';
import PuzzleLoveButton from '../components/quickActions/PuzzleLoveButton';
import PuzzleEditButton from '../components/quickActions/PuzzleEditButton';
import PuzzleSolveControl from '../components/PuzzleSolveControl';
import Loading from '../components/Loading';
import OnlineMetadata from '../metadata/OnlineMetadata';

const SharePuzzleImage = lazy(
  () => import('../components/quickActions/SharePuzzleImage')
);

export interface PerfectionScreenProps {
  quickActions?: React.ReactNode;
  children?: React.ReactNode;
  topLeft?: React.ReactNode;
  solvePath?: Position[];
  setSolvePath?: (solvePath: Position[]) => void;
  onReset?: () => void;
}

export default memo(function PerfectionScreen({
  quickActions,
  children,
  topLeft,
  solvePath,
  setSolvePath,
  onReset,
}: PerfectionScreenProps) {
  return (
    <SolvePathContext solvePath={solvePath} setSolvePath={setSolvePath}>
      <ThreePaneLayout
        collapsible={false}
        left={
          <>
            {topLeft}
            <div className="flex flex-col gap-2 justify-self-stretch flex-1 justify-center">
              <Metadata />
              <GridConsumer>
                {({ grid }) => (
                  <InstructionPartOutlet
                    grid={grid}
                    placement={PartPlacement.LeftPanel}
                  />
                )}
              </GridConsumer>
            </div>
            <GridConsumer>
              {({ grid }) => (
                <InstructionPartOutlet
                  grid={grid}
                  placement={PartPlacement.LeftBottom}
                />
              )}
            </GridConsumer>
            <OnlineMetadata />
            <div className="flex gap-1">
              <PuzzleLoveButton />
              <Suspense fallback={<Loading className="w-12 h-12" />}>
                <SharePuzzleImage />
              </Suspense>
              <PuzzleEditButton />
              {quickActions}
            </div>
            <TouchControls />
            <PerfectionEditControls onReset={onReset} />
            <ModeVariantLoader mode={Mode.Perfection} />
          </>
        }
        center={<MainGrid useToolboxClick={false} />}
        right={
          <>
            <div className="h-full flex flex-col items-stretch justify-center gap-4">
              <InstructionList />
            </div>
            <div className="p-2 w-full flex flex-col items-stretch justify-end gap-2 shrink-0">
              <PuzzleSolveControl />
              {children}
            </div>
          </>
        }
      />
    </SolvePathContext>
  );
});

import { Mode } from '@logic-pad/core/data/primitives';
import MainGrid from '../grid/MainGrid';
import InstructionList from '../instructions/InstructionList';
import InstructionPartOutlet from '../instructions/InstructionPartOutlet';
import { PartPlacement } from '../instructions/parts/types';
import Metadata from '../metadata/Metadata';
import ModeVariantLoader from '../router/ModeVariantLoader';
import React, { lazy, memo, Suspense, useMemo, useState } from 'react';
import OnlineMetadata from '../metadata/OnlineMetadata';
import PuzzleLoveButton from '../components/quickActions/PuzzleLoveButton';
import PuzzleSolveControl from '../components/PuzzleSolveControl';
import PuzzleEditButton from '../components/quickActions/PuzzleEditButton';
import Loading from '../components/Loading';
import { getGridAtom, metadataAtom } from '../state/grid.ts';
import { useAtomValue } from 'jotai';
import PuzzleSurface from '../components/PuzzleSurface';
import {
  SolveScreenContext,
  SolveScreenContextValue,
  SolveSidebarPanel,
} from './SolveScreenContext.ts';
import CommentPanel from '../online/CommentPanel';
import CollectionPanel from '../online/CollectionPanel';
import { onlinePuzzleAtom } from '../state/onlinePuzzle.ts';
import Difficulty from '../metadata/Difficulty';
import { FaChevronUp, FaTimes } from 'react-icons/fa';
import { cn } from '../uiHelper.ts';

const SharePuzzleImage = lazy(
  () => import('../components/quickActions/SharePuzzleImage')
);

export interface PuzzlePlayScreenProps {
  /**
   * Mode-specific grid controls rendered as a floating bar over the grid.
   */
  controls: React.ReactNode;
  mode: Mode.Solve | Mode.Perfection;
  quickActions?: React.ReactNode;
  children?: React.ReactNode;
  topLeft?: React.ReactNode;
}

const SidebarContent = memo(function SidebarContent({
  quickActions,
  children,
  topLeft,
}: Pick<PuzzlePlayScreenProps, 'quickActions' | 'children' | 'topLeft'>) {
  const { panel, setPanel } = React.useContext(SolveScreenContext);
  if (panel === 'comments') {
    return <CommentPanel onBack={() => setPanel('main')} />;
  }
  if (panel === 'collection') {
    return <CollectionPanel onBack={() => setPanel('main')} />;
  }
  return (
    <div className="h-full flex flex-col justify-between">
      <div>{topLeft}</div>
      <div className="flex flex-col gap-2 justify-self-stretch justify-center">
        <Metadata />
      </div>
      <div className="flex flex-col gap-2">
        <OnlineMetadata />
        <div className="flex gap-1">
          <PuzzleLoveButton />
          <Suspense fallback={<Loading className="w-12 h-12" />}>
            <SharePuzzleImage />
          </Suspense>
          <PuzzleEditButton />
          {quickActions}
        </div>
        <PuzzleSolveControl />
        {children}
      </div>
    </div>
  );
});

const MobileTopBar = memo(function MobileTopBar({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const metadata = useAtomValue(metadataAtom);
  const puzzle = useAtomValue(onlinePuzzleAtom);
  return (
    <button
      className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-base-100 text-base-content shadow-md px-4 py-2 self-stretch"
      onClick={onOpen}
    >
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="truncate text-lg w-full text-start">
          {metadata.title.length === 0 ? 'Untitled Puzzle' : metadata.title}
        </span>
        <span className="text-sm opacity-80 truncate">
          {puzzle?.creator.name ?? metadata.author}
        </span>
      </div>
      <Difficulty value={metadata.difficulty} size="sm" />
      <FaChevronUp className="shrink-0" />
    </button>
  );
});

/**
 * Layout shared by all puzzle-playing screens: a generic left sidebar
 * (metadata, solve controls, comments, collection) next to a raised
 * puzzle-specific surface containing the grid and the instruction list.
 *
 * Responsiveness is handled with CSS only: the sidebar is a static column on
 * large screens and a full-screen overlay toggled from the top bar on narrow
 * screens, while the puzzle surface stacks vertically.
 */
export default memo(function PuzzlePlayScreen({
  controls,
  mode,
  quickActions,
  children,
  topLeft,
}: PuzzlePlayScreenProps) {
  const grid = useAtomValue(getGridAtom);
  const [panel, setPanel] = useState<SolveSidebarPanel>('main');
  const [mobileOpen, setMobileOpen] = useState(false);
  const contextValue = useMemo<SolveScreenContextValue>(
    () => ({
      panel,
      setPanel: p => {
        setPanel(p);
        if (p !== 'main') setMobileOpen(true);
      },
    }),
    [panel]
  );

  return (
    <SolveScreenContext.Provider value={contextValue}>
      <main className="flex flex-1 min-h-0 self-stretch flex-col lg:flex-row pb-32 lg:pb-0">
        <MobileTopBar onOpen={() => setMobileOpen(true)} />
        <aside
          className={cn(
            'bg-base-100 text-base-content flex-col gap-4 overflow-y-auto',
            'lg:static lg:flex lg:w-[360px] lg:shrink-0 lg:p-4',
            mobileOpen ? 'fixed inset-0 z-50 flex p-4' : 'hidden'
          )}
        >
          <button
            className="btn btn-ghost self-end lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
          <SidebarContent quickActions={quickActions} topLeft={topLeft}>
            {children}
          </SidebarContent>
          <ModeVariantLoader mode={mode} />
        </aside>
        <div className="flex-1 min-w-0 p-2 lg:p-4 lg:pl-0 flex">
          <PuzzleSurface className="flex-1 lg:min-h-0 flex flex-col lg:flex-row min-h-[calc(100dvh-12rem)]">
            <div className="relative flex-1 min-w-0 flex order-1">
              <div className="grow shrink overflow-auto self-stretch p-4 lg:p-8">
                <div className="flex items-center justify-center m-0 p-0 min-h-full min-w-full h-fit w-fit">
                  <MainGrid useToolboxClick={false} />
                </div>
              </div>
              {controls}
            </div>
            <div className="lg:w-[352px] shrink-0 flex flex-col gap-4 p-4 lg:pl-2 lg:overflow-y-auto order-2">
              <div className="lg:flex-1 lg:min-h-0 flex flex-col items-center justify-center gap-4">
                <InstructionList className="lg:left-0" />
              </div>
              <InstructionPartOutlet
                grid={grid}
                placement={PartPlacement.SideBar}
              />
            </div>
          </PuzzleSurface>
        </div>
      </main>
    </SolveScreenContext.Provider>
  );
});

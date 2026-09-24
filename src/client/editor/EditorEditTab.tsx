import { memo, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { getGridAtom, metadataAtom } from '../state/grid.ts';
import { embedFeaturesAtom } from '../state/embed.ts';
import PuzzleSurface from '../components/PuzzleSurface';
import ToolboxEditor from './ToolboxEditor';
import EditorMainGrid from './EditorMainGrid';
import { EditorGridControls } from '../components/GridControlsBar';
import InstructionList from '../instructions/InstructionList';
import InstructionSearch from '../instructions/InstructionSearch';
import InstructionPartOutlet from '../instructions/InstructionPartOutlet';
import { PartPlacement } from '../instructions/parts/types';
import ConfigPopup from '../configs/ConfigPopup';
import PuzzleChecklist from './PuzzleChecklist';
import PreviewModal, { PreviewRef } from './PreviewModal';
import { FaEye } from 'react-icons/fa';
import { cn } from '../uiHelper.ts';

export interface EditorEditTabProps {
  toolboxCollapsed: boolean;
  onToggleToolbox: () => void;
  onGoToInfoTab: () => void;
}

/**
 * Puzzle-specific tab of the editor housing the toolbox, the grid, the
 * instruction list, the preview button and a collapsible checklist.
 */
export default memo(function EditorEditTab({
  toolboxCollapsed,
  onToggleToolbox,
  onGoToInfoTab,
}: EditorEditTabProps) {
  const grid = useAtomValue(getGridAtom);
  const metadata = useAtomValue(metadataAtom);
  const features = useAtomValue(embedFeaturesAtom);
  const previewRef = useRef<PreviewRef>(null);

  return (
    <PuzzleSurface className="flex-1 m-2 mb-28 lg:mb-2 h-full lg:min-h-0 flex flex-col lg:flex-row min-h-[calc(100dvh-14rem)]">
      <div
        className={cn(
          'shrink-0 order-1',
          toolboxCollapsed
            ? 'overflow-x-auto overflow-y-hidden sticky top-0 z-30 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-18'
            : 'lg:w-[320px] lg:p-2 overflow-y-auto overflow-x-hidden lg:pb-18'
        )}
      >
        <ToolboxEditor
          collapsed={toolboxCollapsed}
          onToggleCollapse={onToggleToolbox}
        />
      </div>
      <div className="relative flex-1 min-w-0 flex order-2 min-h-[60vh] lg:min-h-0">
        <div className="grow shrink overflow-auto self-stretch p-4 lg:p-8">
          <div className="flex items-center justify-center m-0 p-0 min-h-full min-w-full h-fit w-fit lg:mb-18">
            <EditorMainGrid />
          </div>
        </div>
        <EditorGridControls />
      </div>
      <div className="lg:w-[352px] shrink-0 flex flex-col gap-4 p-4 lg:pl-2 lg:overflow-y-auto order-3">
        {features.instructions && (
          <InstructionSearch className="tour-instruction-search z-10" />
        )}
        <div className="lg:flex-1 lg:min-h-0 flex flex-col items-center justify-center gap-4">
          <InstructionList
            editable={features.instructions}
            className="lg:left-0"
          />
          <ConfigPopup key="config-popup" />
        </div>
        <InstructionPartOutlet grid={grid} placement={PartPlacement.SideBar} />
        {features.preview && (
          <>
            <button
              className="btn rounded-xl tour-preview shrink-0"
              onClick={() => previewRef.current?.open(grid, metadata)}
            >
              <FaEye size={18} />
              Preview puzzle
            </button>
            <PreviewModal ref={previewRef} />
          </>
        )}
        {features.checklist && <PuzzleChecklist onTabSwitch={onGoToInfoTab} />}
      </div>
    </PuzzleSurface>
  );
});

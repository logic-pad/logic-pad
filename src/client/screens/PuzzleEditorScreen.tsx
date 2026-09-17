import InstructionList from '../instructions/InstructionList';
import { EditorEditControls } from '../components/EditControls';
import InstructionSearch from '../instructions/InstructionSearch';
import React, { memo, useRef, useState } from 'react';
import ThreePaneLayout from '../components/ThreePaneLayout';
import TouchControls from '../components/TouchControls';
import ConfigPopup from '../configs/ConfigPopup';
import EditorSideTabs, { EditorTabKey } from '../editor/EditorSideTabs';
import PuzzleChecklist from '../editor/PuzzleChecklist';
import InstructionPartOutlet from '../instructions/InstructionPartOutlet';
import { PartPlacement } from '../instructions/parts/types';
import ModeVariantLoader from '../router/ModeVariantLoader';
import { Mode } from '@logic-pad/core/data/primitives';
import EditorCenterTabs from '../editor/EditorCenterTabs';
import PreviewModal, { PreviewRef } from '../editor/PreviewModal';
import PuzzleSaveControl from '../components/PuzzleSaveControl';
import { FaEye } from 'react-icons/fa';
import { animate } from 'animejs';
import EditorTour from '../components/EditorTour';
import { gridAtom, metadataAtom } from '../state/grid.ts';
import { embedFeaturesAtom } from '../state/embed.tsx';
import { EditorScope } from '../state/scopes.tsx';
import { useAtomValue } from 'jotai';

export interface PuzzleEditorScreenProps {
  children?: React.ReactNode;
}

export default memo(function PuzzleEditorScreen({
  children,
}: PuzzleEditorScreenProps) {
  const grid = useAtomValue(gridAtom);
  const metadata = useAtomValue(metadataAtom);
  const features = useAtomValue(embedFeaturesAtom);
  const [editorTab, setEditorTab] = useState<EditorTabKey>('Tools');
  const previewRef = useRef<PreviewRef>(null);
  const switchToTab = (tab: EditorTabKey) => {
    if (editorTab !== tab) {
      setEditorTab(tab);
    } else if (tab === 'Info') {
      animate('.animate-online-tab', {
        scale: [
          {
            to: 1.05,
            duration: 100,
          },
          {
            to: 1,
            duration: 200,
          },
        ],
        ease: 'inOutSine',
        onComplete: () => {
          const elements =
            document.getElementsByClassName('animate-online-tab');
          for (const element of elements) {
            (element as HTMLElement).style.removeProperty('transform');
          }
        },
      });
    }
  };
  return (
    <EditorScope>
      <ThreePaneLayout
        collapsible={true}
        left={
          <>
            <EditorSideTabs
              editorTab={editorTab}
              onEditorTabChange={setEditorTab}
            />
            <div className="shrink-0 flex-col gap-1 hidden has-[*]:flex">
              <InstructionPartOutlet
                grid={grid}
                placement={PartPlacement.LeftPanel}
              />
              <InstructionPartOutlet
                grid={grid}
                placement={PartPlacement.LeftBottom}
              />
            </div>
            <TouchControls />
            <EditorEditControls />
            <ModeVariantLoader mode={Mode.Create} />
          </>
        }
        center={
          <EditorCenterTabs
            editorMode={editorTab === 'Info' ? 'info' : 'grid'}
          />
        }
        right={
          <>
            <div className="h-full flex flex-col items-center justify-center gap-4">
              {features.instructions && (
                <InstructionSearch className="tour-instruction-search z-10" />
              )}
              <InstructionList editable={features.instructions} />
              <ConfigPopup key="config-popup" />
            </div>
            <div className="pb-2 w-full flex flex-col self-center items-stretch justify-end gap-2 shrink-0 max-w-[320px]">
              {children}
              {features.preview && (
                <>
                  <button
                    className="btn rounded-2xl tour-preview"
                    onClick={() => previewRef.current?.open(grid, metadata)}
                  >
                    <FaEye size={18} />
                    Preview puzzle
                  </button>
                  <PreviewModal ref={previewRef} />
                </>
              )}
              <PuzzleChecklist onTabSwitch={() => switchToTab('Info')} />
              {features.saveControl && (
                <PuzzleSaveControl onTabSwitch={() => switchToTab('Info')} />
              )}
            </div>
          </>
        }
      />
      <EditorTour setEditorTab={switchToTab} />
    </EditorScope>
  );
});

import React, { memo, Suspense, lazy, useState } from 'react';
import { Mode } from '@logic-pad/core/data/primitives';
import ModeVariantLoader from '../router/ModeVariantLoader';
import EditorTopBar, { EditorTab } from '../editor/EditorTopBar';
import EditorEditTab from '../editor/EditorEditTab';
import EditorInfoTab from '../editor/EditorInfoTab';
import Loading from '../components/Loading';
import EditorTour from '../components/EditorTour';
import { useAtomValue } from 'jotai';
import { embedFeaturesAtom } from '../state/embed.ts';
import { EditorScope } from '../state/scopes/EditorScope.tsx';
import { animate } from 'animejs';

const SourceCodeEditor = lazy(() => import('../editor/SourceCodeEditor'));

export interface PuzzleEditorScreenProps {
  children?: React.ReactNode;
}

/**
 * The puzzle editor. A screen-width top bar below the app nav hosts basic
 * puzzle info, cloud save controls and the tab switcher, while the three
 * full-screen tabs (Info / Edit / Code) fill the remaining space.
 */
export default memo(function PuzzleEditorScreen({
  children,
}: PuzzleEditorScreenProps) {
  const features = useAtomValue(embedFeaturesAtom);
  const [editorTab, setEditorTab] = useState<EditorTab>('Edit');
  const [toolboxCollapsed, setToolboxCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1280
  );

  const switchToTab = (tab: EditorTab) => {
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
      <div className="flex flex-col flex-1 min-h-0 self-stretch lg:pb-0">
        <EditorTopBar tab={editorTab} onTabChange={switchToTab}>
          {children}
        </EditorTopBar>
        {editorTab === 'Info' && features.metadata ? (
          <EditorInfoTab onChecklistAction={() => switchToTab('Info')} />
        ) : editorTab === 'Code' ? (
          <Suspense fallback={<Loading />}>
            <SourceCodeEditor loading={<Loading />} />
          </Suspense>
        ) : (
          <EditorEditTab
            toolboxCollapsed={toolboxCollapsed}
            onToggleToolbox={() => setToolboxCollapsed(c => !c)}
            onGoToInfoTab={() => switchToTab('Info')}
          />
        )}
        <ModeVariantLoader mode={Mode.Create} />
      </div>
      <EditorTour
        setEditorTab={switchToTab}
        setToolboxCollapsed={setToolboxCollapsed}
      />
    </EditorScope>
  );
});

import { Suspense, lazy, memo } from 'react';
import { cn } from '../uiHelper.ts';
import Loading from '../components/Loading.tsx';
import MetadataEditor from './MetadataEditor.tsx';
import { useEmbed } from '../contexts/EmbedContext.tsx';

const ToolboxEditor = lazy(() => import('./ToolboxEditor.tsx'));
const SourceCodeEditor = lazy(() => import('./SourceCodeEditor.tsx'));

const panes = {
  Info: <MetadataEditor key="Info" />,
  Tools: <ToolboxEditor key="Tools" />,
  Code: <SourceCodeEditor key="Code" loading={<Loading />} />,
} as const;

export type EditorTabKey = keyof typeof panes;

export interface EditorSideTabsProps {
  editorTab: EditorTabKey;
  onEditorTabChange: (key: EditorTabKey) => void;
}

export default memo(function EditorSideTabs({
  editorTab,
  onEditorTabChange,
}: EditorSideTabsProps) {
  const { features } = useEmbed();

  return (
    <div className="flex-1 flex flex-col gap-2 -mt-4">
      <div role="tablist" className="tabs tabs-border shrink-0 justify-center">
        {Object.entries(panes).map(([name]) =>
          !features.metadata && name === 'Info' ? null : (
            <a
              key={name}
              role="tab"
              className={cn(
                'tab text-neutral-content',
                editorTab === name && 'tab-active',
                name === 'Info' && 'font-black'
              )}
              onClick={() => onEditorTabChange(name as EditorTabKey)}
            >
              {name}
            </a>
          )
        )}
      </div>
      <Suspense fallback={<Loading />}>
        {panes[features.metadata || editorTab !== 'Info' ? editorTab : 'Tools']}
      </Suspense>
    </div>
  );
});

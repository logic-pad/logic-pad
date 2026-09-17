import { Suspense, lazy, memo } from 'react';
import Loading from '../components/Loading.tsx';
import { useOnline } from '../state/online.ts';

const EditorMainGrid = lazy(() => import('./EditorMainGrid.tsx'));
const EditorOnlineTab = lazy(() => import('./EditorOnlineTab.tsx'));

const panes = [
  ['Grid', <EditorMainGrid key="Grid" />],
  ['Online', <EditorOnlineTab key="Online" />],
] as const;

export interface EditorCenterTabsProps {
  editorMode: 'grid' | 'info';
}

export default memo(function EditorCenterTabs({
  editorMode,
}: EditorCenterTabsProps) {
  const online = useOnline();
  return (
    <Suspense fallback={<Loading />}>
      {panes[editorMode === 'grid' || !online.isOnline ? 0 : 1][1]}
    </Suspense>
  );
});

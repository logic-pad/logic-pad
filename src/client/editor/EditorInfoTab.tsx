import { memo } from 'react';
import { useAtomValue } from 'jotai';
import MetadataEditor from './MetadataEditor';
import PuzzleChecklist from './PuzzleChecklist';
import EditorOnlinePanel from './EditorOnlinePanel.tsx';
import CommentPanel from '../online/CommentPanel';
import { onlinePuzzleIdAtom } from '../state/onlinePuzzle.ts';
import { useOnline } from '../state/online.ts';
import { embedFeaturesAtom } from '../state/embed.ts';

export interface EditorInfoTabProps {
  /**
   * Called when the checklist's publish/statistics button is clicked while
   * already on the Info tab.
   */
  onChecklistAction?: () => void;
}

/**
 * Generic tab of the puzzle editor for editing puzzle metadata, viewing
 * online statistics and comments, and fulfilling the publication checklist.
 */
export default memo(function EditorInfoTab({
  onChecklistAction,
}: EditorInfoTabProps) {
  const { me } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const features = useAtomValue(embedFeaturesAtom);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-4 lg:p-8 max-w-[1800px] mx-auto items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <MetadataEditor />
        </div>
        <div className="flex flex-col gap-6 min-w-0">
          <EditorOnlinePanel />
          {features.checklist && (
            <PuzzleChecklist
              collapsible={false}
              interactive={false}
              onTabSwitch={onChecklistAction}
            />
          )}
        </div>
        <div className="min-w-0 lg:col-span-2 xl:col-span-1 flex flex-col gap-4">
          <div className="bg-base-200 rounded-xl p-4 shadow-sm">
            {id && me ? (
              <CommentPanel className="xl:max-h-[calc(100vh-14rem)] bg-base-200" />
            ) : (
              <p className="opacity-70">
                {id
                  ? 'Sign in to view and post comments.'
                  : 'Comments are available once the puzzle is uploaded.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

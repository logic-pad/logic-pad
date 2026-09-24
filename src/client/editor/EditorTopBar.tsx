import { memo, ReactNode, useState } from 'react';
import { useAtomValue } from 'jotai';
import { metadataAtom } from '../state/grid.ts';
import { useOnline } from '../state/online.ts';
import { onlinePuzzleAtom, onlinePuzzleIdAtom } from '../state/onlinePuzzle.ts';
import { useQuery } from '@tanstack/react-query';
import { puzzleEditQueryOptions } from '../routes/_layout.create.$puzzleId.tsx';
import { ResourceStatus } from '../online/data.ts';
import PuzzleSaveControl from '../components/PuzzleSaveControl.tsx';
import { cn } from '../uiHelper.ts';
import { FaChevronDown } from 'react-icons/fa';
import { embedFeaturesAtom } from '../state/embed.ts';

export type EditorTab = 'Info' | 'Edit' | 'Code';

const tabs: EditorTab[] = ['Info', 'Edit', 'Code'];

const OnlineStatusBadge = memo(function OnlineStatusBadge() {
  const { isOnline } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const { data } = useQuery(puzzleEditQueryOptions(id));

  if (!isOnline) {
    return <div className="badge badge-neutral shrink-0">Offline</div>;
  }
  if (!id || !data) {
    return <div className="badge badge-neutral shrink-0">Local</div>;
  }
  if (data.status === ResourceStatus.Private) {
    return <div className="badge badge-neutral shrink-0">Private</div>;
  }
  return (
    <div className="badge badge-info shrink-0 capitalize">{data.status}</div>
  );
});

export interface EditorTopBarProps {
  tab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  children?: ReactNode;
}

/**
 * Screen-width bar below the application-wide nav bar. Shows basic puzzle
 * info and cloud save controls on the left and the tab switcher on the right.
 * On narrow screens it collapses to only show the tab switcher and expands
 * downwards to reveal the remaining UI.
 */
export default memo(function EditorTopBar({
  tab,
  onTabChange,
  children,
}: EditorTopBarProps) {
  const metadata = useAtomValue(metadataAtom);
  const puzzle = useAtomValue(onlinePuzzleAtom);
  const features = useAtomValue(embedFeaturesAtom);
  const [expanded, setExpanded] = useState(false);

  return (
    <header className="bg-base-200 text-base-content shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 py-0 mx-2 rounded-xl shadow-sm">
      <button
        className="btn btn-sm btn-ghost btn-square lg:hidden ps-4"
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? 'Collapse puzzle bar' : 'Expand puzzle bar'}
      >
        <FaChevronDown
          className={cn('transition-transform', expanded && 'rotate-180')}
        />
      </button>
      <div
        role="tablist"
        className="tabs tabs-box tabs-md lg:tabs-lg ml-auto lg:ml-0 lg:order-last shrink-0"
      >
        {tabs.map(name =>
          !features.metadata && name === 'Info' ? null : (
            <a
              key={name}
              role="tab"
              className={cn('tab', tab === name && 'tab-active bg-primary')}
              onClick={() => onTabChange(name)}
            >
              {name}
            </a>
          )
        )}
      </div>
      <div
        className={cn(
          'flex-col gap-2 lg:gap-4 lg:flex-row lg:items-center lg:flex-1 lg:min-w-0 lg:flex',
          expanded ? 'flex w-full' : 'hidden'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 ps-4">
          <span className="text-lg truncate font-medium">
            {metadata.title.length === 0 ? 'Untitled Puzzle' : metadata.title}
          </span>
          <OnlineStatusBadge />
          {(puzzle?.creator.name ?? metadata.author).length > 0 && (
            <span className="opacity-70 truncate hidden sm:inline">
              by {puzzle?.creator.name ?? metadata.author}
            </span>
          )}
        </div>
        {features.saveControl && (
          <PuzzleSaveControl onTabSwitch={() => onTabChange('Info')} />
        )}
        {children}
      </div>
    </header>
  );
});

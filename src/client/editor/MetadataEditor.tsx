import { memo, useEffect } from 'react';
import Difficulty from '../metadata/Difficulty.tsx';
import { useAtomValue, useSetAtom } from 'jotai';
import { metadataAtom } from '../state/grid.ts';
import { cn } from '../../client/uiHelper.ts';
import { useOnline } from '../state/online.ts';
import {
  lastSavedPuzzleAtom,
  onlinePuzzleAtom,
  onlinePuzzleIdAtom,
} from '../state/onlinePuzzle.ts';
import UserCard from '../metadata/UserCard.tsx';
import { Link } from '@tanstack/react-router';

// million-ignore
export default memo(function MetadataEditor() {
  const metadata = useAtomValue(metadataAtom);
  const setMetadata = useSetAtom(metadataAtom);
  const { isOnline, me } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const puzzle = useAtomValue(onlinePuzzleAtom);
  const lastSaved = useAtomValue(lastSavedPuzzleAtom);
  const setLastSaved = useSetAtom(lastSavedPuzzleAtom);

  useEffect(() => {
    if (isOnline && !id && me !== null && metadata.author !== me.name) {
      setMetadata({ ...metadata, author: me.name });
      setLastSaved({
        ...lastSaved,
        author: me.name,
      });
    }
  }, [isOnline, id, me, metadata, setMetadata, setLastSaved, lastSaved]);

  return (
    <div className="bg-base-200 text-base-content rounded-xl p-4 flex flex-col gap-2 shadow-sm tour-metadata-editor">
      <fieldset className="fieldset">
        <div className="label justify-between">
          <span className="label-text">Title</span>
          <span className="text-base-content text-sm opacity-70 self-end">
            {metadata.title.length}/100
          </span>
        </div>
        <input
          type="text"
          placeholder="Required"
          maxLength={100}
          className={cn('input w-full', metadata.title === '' && 'input-error')}
          value={metadata.title}
          onChange={e => setMetadata({ ...metadata, title: e.target.value })}
        />
      </fieldset>
      {isOnline && !!id && puzzle?.series && (
        <div className="text-sm opacity-80 ms-2">
          Part of the{' '}
          <Link
            to="/collection/$collectionId"
            params={{ collectionId: puzzle.series.id }}
            className="link link-accent"
          >
            {puzzle.series.title}
          </Link>{' '}
          series
        </div>
      )}
      {isOnline && (!!id || !!me) ? (
        <fieldset className="fieldset">
          <div className="label">
            <span className="label-text">Author</span>
          </div>
          <UserCard user={puzzle?.creator ?? me} />
        </fieldset>
      ) : (
        <fieldset className="fieldset">
          <div className="label">
            <span className="label-text">Author</span>
          </div>
          <input
            type="text"
            placeholder="Required"
            className={cn(
              'input w-full',
              metadata.author === '' && 'input-error'
            )}
            maxLength={100}
            value={metadata.author}
            onChange={e => setMetadata({ ...metadata, author: e.target.value })}
          />
        </fieldset>
      )}
      <fieldset className="fieldset">
        <div className="label">
          <span className="label-text">Design difficulty</span>
        </div>
        <Difficulty
          value={metadata.difficulty}
          onChange={e => setMetadata({ ...metadata, difficulty: e })}
        />
      </fieldset>
      <fieldset className="fieldset flex-1 flex flex-col">
        <div className="label justify-between">
          <span className="label-text">Description</span>
          <span className="text-base-content text-sm opacity-70 self-end">
            {metadata.description.length}/500
          </span>
        </div>
        <textarea
          className="textarea h-60 w-full resize-none"
          placeholder="Optional text"
          maxLength={500}
          value={metadata.description}
          onChange={e =>
            setMetadata({ ...metadata, description: e.target.value })
          }
        ></textarea>
      </fieldset>
    </div>
  );
});

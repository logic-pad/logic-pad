import { memo, useEffect } from 'react';
import Difficulty from '../metadata/Difficulty.tsx';
import { useGrid } from '../contexts/GridContext.tsx';
import { cn } from '../../client/uiHelper.ts';
import { useOnline } from '../contexts/OnlineContext.tsx';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext.tsx';
import UserCard from '../metadata/UserCard.tsx';
import { Link } from '@tanstack/react-router';

// million-ignore
export default memo(function MetadataEditor() {
  const { metadata, setMetadata } = useGrid();
  const { isOnline, me } = useOnline();
  const { id, puzzle, lastSaved, setLastSaved } = useOnlinePuzzle();

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
    <div className="bg-base-100 text-base-content rounded-2xl p-4 flex flex-col grow h-full gap-2 shadow-sm tour-metadata-editor">
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
          className="textarea h-full resize-none"
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

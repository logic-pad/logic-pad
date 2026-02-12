import { useOnline } from '../contexts/OnlineContext';
import { PiSignInBold } from 'react-icons/pi';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import { FaCloudUploadAlt, FaLink, FaSave } from 'react-icons/fa';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGrid } from '../contexts/GridContext.tsx';
import { cn, safeClipboard } from '../uiHelper.ts';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers.ts';
import { useMutation } from '@tanstack/react-query';
import { api, queryClient } from '../online/api.ts';
import toast from 'react-hot-toast';
import Loading from './Loading.tsx';
import { useHotkeys } from 'react-hotkeys-hook';
import debounce from 'lodash/debounce';
import { PuzzleMetadata } from '@logic-pad/core/data/puzzle';
import GridData from '@logic-pad/core/data/grid';
import DynamicRelativeTime from './DynamicRelativeTime.tsx';

const CopyLink = memo(function CopyLink() {
  const { grid, solution, metadata } = useGrid();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { id } = useOnlinePuzzle();
  useEffect(() => {
    if (tooltip && tooltip.length > 0) {
      const timeout = window.setTimeout(() => setTooltip(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [tooltip]);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return (
    <div
      className={cn(
        'tooltip tooltip-info tooltip-top flex-1',
        tooltip && 'tooltip-open'
      )}
      data-tip={tooltip}
    >
      <details ref={detailsRef} className="dropdown dropdown-end dropdown-top">
        <summary className="btn btn-sm btn-ghost">
          <FaLink size={20} />
        </summary>
        <ul className="menu dropdown-content bg-base-300 rounded-box z-50 mb-2 w-52 p-2 shadow-sm">
          <li>
            <a
              onClick={async () => {
                const url = new URL(window.location.href);
                if (id) {
                  url.pathname = '/create/' + id;
                } else {
                  const data = await Compressor.compress(
                    Serializer.stringifyPuzzle({ ...metadata, grid, solution })
                  );
                  url.searchParams.set('loader', 'visible');
                  url.searchParams.set('d', data);
                  url.pathname = '/create';
                  await safeClipboard.writeText(url.href);
                }
                await safeClipboard.writeText(url.href);
                setTooltip('Copied!');
                detailsRef.current!.open = false;
              }}
            >
              Copy edit link
            </a>
          </li>
          <li>
            <a
              onClick={async () => {
                const url = new URL(window.location.href);
                if (id) {
                  url.pathname = '/solve/' + id;
                } else {
                  const data = await Compressor.compress(
                    Serializer.stringifyPuzzle({ ...metadata, grid, solution })
                  );
                  url.searchParams.set('d', data);
                  url.pathname = '/solve';
                }
                await safeClipboard.writeText(url.href);
                setTooltip('Copied!');
                detailsRef.current!.open = false;
              }}
            >
              Copy share link
            </a>
          </li>
        </ul>
      </details>
    </div>
  );
});

const SavePuzzle = memo(function SavePuzzle({
  debounceDelay,
}: {
  debounceDelay: number;
}) {
  const { id, setLastSaved } = useOnlinePuzzle();
  const { metadata, grid } = useGrid();
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const { isPending, mutate } = useMutation({
    mutationFn: (data: Parameters<typeof api.savePuzzle>) => {
      return api.savePuzzle(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      setLastSavedTime(new Date());
      setLastSaved({
        ...metadata,
        grid,
        solution: null,
      });
      queryClient.removeQueries({
        queryKey: ['puzzle', 'edit', id],
      });
    },
  });
  const save = useCallback(
    async (grid: GridData, metadata: PuzzleMetadata) => {
      const data = await Compressor.compress(Serializer.stringifyGrid(grid));
      mutate([
        id!,
        metadata.title,
        metadata.description,
        metadata.difficulty,
        data,
      ]);
    },
    [id, mutate]
  );
  const debouncedSave = useMemo(
    () => debounce(save, debounceDelay, { leading: false, trailing: true }),
    [save, debounceDelay]
  );
  useHotkeys('ctrl+s', () => save(grid, metadata), {
    preventDefault: true,
    enabled: !!id,
    useKey: true,
  });
  useEffect(() => {
    if (lastSavedTime === null) {
      setLastSavedTime(new Date());
      return;
    }
    void debouncedSave(grid, metadata);
  }, [grid, metadata, debouncedSave, lastSavedTime]);

  return (
    <div className="flex p-2 ps-4 rounded-2xl shadow-md bg-base-100 text-base-content text-sm items-center justify-between tour-upload">
      {lastSavedTime ? (
        <>
          Last saved <DynamicRelativeTime time={lastSavedTime} />
        </>
      ) : (
        <>Saved</>
      )}
      <div className="flex items-center gap-2">
        <CopyLink />
        <div
          className="tooltip tooltip-left tooltip-info"
          data-tip="Save (Ctrl+S)"
        >
          {isPending ? (
            <Loading className="h-8 w-12 px-3" />
          ) : (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => save(grid, metadata)}
            >
              <FaSave size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export interface PuzzleSaveControlProps {
  onTabSwitch?: () => void;
}

export default memo(function PuzzleSaveControl({
  onTabSwitch,
}: PuzzleSaveControlProps) {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();

  if (!isOnline) {
    return (
      <div className="flex p-2 ps-4 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between tour-upload">
        Editing offline
        <div className="flex items-center gap-2">
          <CopyLink />
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex p-2 ps-4 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between tour-upload">
        Sign in to upload
        <div className="flex items-center gap-2">
          <CopyLink />
          <div className="tooltip tooltip-top tooltip-info" data-tip="Sign in">
            <button className="btn btn-sm btn-ghost" onClick={onTabSwitch}>
              <PiSignInBold size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex p-2 ps-4 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between tour-upload">
        Editing locally
        <div className="flex items-center gap-2">
          <CopyLink />
          <div className="tooltip tooltip-top tooltip-info" data-tip="Upload">
            <button className="btn btn-sm btn-ghost" onClick={onTabSwitch}>
              <FaCloudUploadAlt size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <SavePuzzle debounceDelay={me.supporter > 0 ? 5000 : 60000} />;
});

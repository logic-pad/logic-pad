import { useOnline } from '../contexts/OnlineContext.tsx';
import { PiSignInBold } from 'react-icons/pi';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext.tsx';
import {
  memo,
  RefObject,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import storedRedirect from '../router/storedRedirect.ts';
import { useGridState } from '../contexts/GridStateContext.tsx';
import { State } from '@logic-pad/core/data/primitives';
import onlineSolveTracker from '../router/onlineSolveTracker.ts';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiError, queryClient } from '../online/api.ts';
import Loading from './Loading.tsx';
import Difficulty from '../metadata/Difficulty.tsx';
import toast from 'react-hot-toast';
import { animate } from 'animejs';
import { useReducedMotion } from '../contexts/SettingsContext.tsx';
import { PuzzleFull, SolveSession } from '../online/data.ts';
import CommentSidebar from '../online/CommentSidebar.tsx';
import { FaComment, FaDownload, FaSave } from 'react-icons/fa';
import { router } from '../router/router';
import { cn, count } from '../uiHelper.ts';
import { useNavigate } from '@tanstack/react-router';
import { useGrid } from '../contexts/GridContext.tsx';
import { useHotkeys } from 'react-hotkeys-hook';
import debounce from 'lodash/debounce';
import GridData from '@logic-pad/core/data/grid.ts';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors.ts';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers.ts';
import DynamicRelativeTime from './DynamicRelativeTime.tsx';
import { array } from '@logic-pad/core/index.ts';

const SolveTrackerAnonymous = memo(function SolveTracker() {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();
  const { state } = useGridState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOnline || !!me || !id) return;
    if (State.isSatisfied(state.final)) {
      void onlineSolveTracker.completeSolve(id);
    }
  }, [isOnline, me, id, state.final]);

  const solved = useMemo(
    () => (!id ? false : onlineSolveTracker.isSolved(id)),
    [id]
  );

  if (!isOnline || !!me || !id) return null;

  return (
    <div className="flex p-2 ps-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between">
      {solved || State.isSatisfied(state.final)
        ? 'Puzzle solved!'
        : 'Sign in to track solves'}
      <div className="flex items-center gap-2">
        <div className="tooltip tooltip-top tooltip-info" data-tip="Sign in">
          <button
            className="btn btn-sm btn-ghost"
            onClick={async () => {
              await navigate({
                to: '/auth',
                search: {
                  redirect: storedRedirect.set(router.state.location),
                },
              });
            }}
          >
            <PiSignInBold size={22} />
          </button>
        </div>
      </div>
    </div>
  );
});

const RatePuzzle = memo(function RatePuzzle({
  initialRating,
}: {
  initialRating: number;
}) {
  const { id } = useOnlinePuzzle();
  const [rating, setRating] = useState(initialRating);
  const rateQuery = useMutation({
    mutationFn: (variables: Parameters<typeof api.ratePuzzle>) => {
      return api.ratePuzzle(...variables);
    },
    onMutate: variables => {
      setRating(variables[1]);
      return { rating };
    },
    onError(error, _variables, context) {
      toast.error(error.message);
      if (context) setRating(context.rating);
    },
    retry: (retryCount, error) => {
      if (error instanceof ApiError && error.status === 403) {
        return false;
      }
      return retryCount < 4;
    },
    retryDelay: retryCount =>
      Math.min(1000 * 2 ** Math.max(0, retryCount - 1), 5000),
  });
  return (
    <Difficulty
      value={rating}
      readonly={false}
      onChange={async value => {
        await rateQuery.mutateAsync([id!, value]);
        setRating(value);
        const puzzleBrief = await api.getPuzzleBriefForSolve(id!);
        await queryClient.setQueryData(
          ['puzzle', 'solve', id],
          (puzzle: PuzzleFull) => ({
            ...puzzle,
            ...puzzleBrief,
          })
        );
      }}
    />
  );
});

const commentCountQueryOptions = (puzzleId: string) =>
  queryOptions({
    queryKey: ['puzzle', puzzleId, 'comments', 'count'],
    queryFn: () => api.countComments(puzzleId),
  });

async function loadSolution(
  grid: GridData,
  solutionData: string | null | undefined
) {
  if (!solutionData) return undefined;
  try {
    const solution = Serializer.parseTiles(
      await Compressor.decompress(solutionData)
    );
    return grid.withTiles(tiles =>
      array(grid.width, grid.height, (x, y) => {
        const tile = tiles[y][x];
        if (tile.exists && !tile.fixed) {
          const color = solution[y]?.[x]?.color;
          if (color) return tile.withColor(color);
        }
        return tile;
      })
    );
  } catch (e) {
    console.error('Failed to load solution data', e);
    return undefined;
  }
}

const PuzzleCompleted = memo(function PuzzleCompleted({
  initialRating,
  loadSolution,
}: {
  initialRating: number;
  loadSolution?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { me } = useOnline();
  const { id } = useOnlinePuzzle();
  const commentCount = useQuery({
    ...commentCountQueryOptions(id!),
    enabled: !!id && !!me,
  });
  const [openComments, setOpenComments] = useState(false);
  useEffect(() => {
    if (!panelRef.current) return;
    if (reducedMotion) return;
    const animation = animate(panelRef.current, {
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 300,
      ease: 'outExpo',
      onComplete: () => {
        panelRef.current?.style.removeProperty('transform');
      },
    });
    return () => {
      animation.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="overflow-hidden">
      <div
        ref={panelRef}
        className="flex flex-col p-4 gap-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-start justify-between"
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="text-2xl">Puzzle solved!</div>
          {me!.supporter > 0 && (
            <div
              className="tooltip tooltip-left tooltip-info"
              data-tip="Load saved solution"
            >
              <button className="btn btn-ghost" onClick={loadSolution}>
                <FaDownload />
              </button>
            </div>
          )}
        </div>
        <div>How difficult was this puzzle?</div>
        <RatePuzzle initialRating={initialRating} />
        <CommentSidebar
          open={openComments}
          onClose={() => setOpenComments(false)}
          key="commentSidebar"
        />
        <button
          className="btn btn-primary w-full"
          onClick={() => setOpenComments(!openComments)}
        >
          <FaComment /> View comments
          {(commentCount.data?.total ?? 0) > 0 && (
            <span className="badge badge-sm border border-accent">
              {count(commentCount.data?.total)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});

interface TimeHandle {
  elapsedMs: number;
  activeStartTick: number;
}

const PuzzleSolving = memo(function PuzzleSolving({
  timeHandle,
  solved,
}: {
  timeHandle: RefObject<TimeHandle>;
  solved: boolean;
}) {
  const { me } = useOnline();
  const { id } = useOnlinePuzzle();
  const { grid } = useGrid();
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  useEffect(() => {
    const eventHandler = () => {
      console.log('Visibility changed');
      if (document.visibilityState === 'hidden') {
        timeHandle.current.elapsedMs +=
          Date.now() - timeHandle.current.activeStartTick;
        if (id)
          onlineSolveTracker.sendSolvingBeacon(
            id,
            timeHandle.current.elapsedMs
          );
        timeHandle.current.elapsedMs = 0;
      } else {
        timeHandle.current.activeStartTick = Date.now();
      }
    };
    document.addEventListener('visibilitychange', eventHandler, false);
    return () => {
      document.removeEventListener('visibilitychange', eventHandler);
    };
  }, [id, timeHandle]);

  const commentCount = useQuery({
    ...commentCountQueryOptions(id!),
    enabled: !!id,
  });
  const [openComments, setOpenComments] = useState(false);

  const { isPending, mutate } = useMutation({
    mutationFn: (data: Parameters<typeof api.solveSessionSolving>) => {
      return api.solveSessionSolving(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess(_data, variables) {
      setLastSavedTime(new Date());
      queryClient.setQueryData<SolveSession>(
        ['solveSession', 'begin', id],
        prev =>
          prev
            ? {
                ...prev,
                solutionData: variables[2] ?? null,
              }
            : prev
      );
    },
  });
  const save = useCallback(
    async (grid: GridData) => {
      const data =
        me!.supporter > 0
          ? await Compressor.compress(Serializer.stringifyTiles(grid.tiles))
          : undefined;
      timeHandle.current.elapsedMs +=
        Date.now() - timeHandle.current.activeStartTick;
      timeHandle.current.activeStartTick = Date.now();
      mutate([id!, timeHandle.current.elapsedMs, data]);
      timeHandle.current.elapsedMs = 0;
    },
    [me, timeHandle, mutate, id]
  );
  const debouncedSave = useMemo(
    () =>
      debounce(save, 10000, {
        leading: false,
        trailing: true,
        maxWait: 10000,
      }),
    [save]
  );
  useHotkeys('ctrl+s', () => save(grid), {
    preventDefault: true,
    enabled: !!id,
    useKey: true,
  });
  useEffect(() => {
    if (solved) return;
    if (lastSavedTime === null) {
      setLastSavedTime(new Date());
      return;
    }
    void debouncedSave(grid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, debouncedSave]);
  useEffect(() => {
    if (solved) {
      debouncedSave.cancel();
    }
  }, [solved, debouncedSave]);

  return (
    <div className="flex p-2 ps-4 rounded-2xl shadow-md bg-base-100 text-base-content text-sm items-center justify-between">
      <span className="flex-auto">
        {solved ? (
          <>Auto-save off</>
        ) : lastSavedTime && me!.supporter > 0 ? (
          <>
            Last saved <DynamicRelativeTime time={lastSavedTime} />
          </>
        ) : (
          <>Unsolved puzzle</>
        )}
      </span>
      <div className="flex-1" />
      <div
        className="tooltip tooltip-left tooltip-info shrink-0"
        data-tip={
          me!.supporter > 0 ? 'Save (Ctrl+S)' : 'Require supporter status'
        }
      >
        {isPending && me!.supporter > 0 ? (
          <Loading className="h-8 w-12 px-3" />
        ) : (
          <button
            className={cn(
              'btn btn-sm btn-ghost',
              me!.supporter === 0 && 'btn-disabled'
            )}
            onClick={async () => {
              if (me!.supporter > 0) await save(grid);
            }}
          >
            <FaSave size={22} />
          </button>
        )}
      </div>
      <CommentSidebar
        open={openComments}
        onClose={() => setOpenComments(false)}
        key="commentSidebar"
      />
      <button
        className="btn btn-sm btn-ghost shrink-0"
        onClick={() => setOpenComments(!openComments)}
      >
        <FaComment />
        {(commentCount.data?.total ?? 0) > 0 && (
          <span className="badge badge-sm border border-accent">
            {count(commentCount.data?.total)}
          </span>
        )}
      </button>
    </div>
  );
});

const SolveTrackerSignedIn = memo(function SolveTracker() {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();
  const { grid, setGrid } = useGrid();
  const { isPending, data } = useQuery({
    queryKey: ['solveSession', 'begin', id],
    queryFn: () => api.solveSessionBegin(id!),
    enabled: isOnline && !!me && !!id,
  });
  const solutionSet = useRef(false);
  const setSolution = useEffectEvent((solutionData: string) => {
    void loadSolution(grid, solutionData).then(solution => {
      if (solution) setGrid(solution);
    });
  });
  useEffect(() => {
    if (
      me!.supporter > 0 &&
      data &&
      !data.solvedAt &&
      data.solutionData &&
      !solutionSet.current
    ) {
      solutionSet.current = true;
      setSolution(data.solutionData);
    }
  }, [data, me]);

  const timeHandle = useRef<TimeHandle>(null!);
  if (timeHandle.current === null) {
    timeHandle.current = {
      elapsedMs: 0,
      // eslint-disable-next-line react-hooks/purity
      activeStartTick: Date.now(),
    };
  }

  const { state } = useGridState();
  const completePuzzle = useEffectEvent(async (grid: GridData) => {
    const solutionData =
      me!.supporter > 0
        ? await Compressor.compress(Serializer.stringifyTiles(grid.tiles))
        : undefined;
    timeHandle.current.elapsedMs +=
      Date.now() - timeHandle.current.activeStartTick;
    const newSolve = await onlineSolveTracker.completeSolve(
      id!,
      timeHandle.current.elapsedMs,
      solutionData
    );
    timeHandle.current.elapsedMs = 0;
    timeHandle.current.activeStartTick = Date.now();
    if (newSolve) {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ['puzzle', 'solve', id],
        }),
        queryClient.refetchQueries({
          queryKey: ['solveSession', 'begin', id],
        }),
      ]);
    }
  });
  const completed = useRef(State.isSatisfied(state.final));
  useEffect(() => {
    if (!isOnline || !me || !id) return;
    if (State.isSatisfied(state.final) && !completed.current) {
      completed.current = true;
      void completePuzzle(grid);
    }
  }, [isOnline, me, id, state.final, grid]);

  if (!isOnline || !me || !id) return null;

  if (isPending) {
    return (
      <div className="flex p-2 ps-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between">
        <Loading />
      </div>
    );
  }

  const solved = !!data!.solvedAt || State.isSatisfied(state.final);

  return (
    <>
      {solved && (
        <PuzzleCompleted
          initialRating={data!.ratedDifficulty ?? 0}
          loadSolution={() => {
            if (data && data.solutionData) {
              void loadSolution(grid, data.solutionData).then(solution => {
                if (solution) setGrid(solution);
              });
            }
          }}
        />
      )}
      <PuzzleSolving timeHandle={timeHandle} solved={solved} />
    </>
  );
});

export default memo(function PuzzleSolveControl() {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();

  if (!isOnline) {
    return (
      <div className="flex p-2 ps-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between">
        Solving offline
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex p-2 ps-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between">
        Solving locally
      </div>
    );
  } else if (me) {
    return <SolveTrackerSignedIn />;
  } else {
    return <SolveTrackerAnonymous />;
  }
});

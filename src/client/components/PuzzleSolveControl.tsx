import { useOnline } from '../contexts/OnlineContext.tsx';
import { PiSignInBold } from 'react-icons/pi';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext.tsx';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import deferredRedirect from '../router/deferredRedirect.ts';
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
import { PuzzleFull } from '../online/data.ts';
import CommentSidebar from '../online/CommentSidebar.tsx';
import { FaComment } from 'react-icons/fa';
import { router } from '../router/router';
import { count } from '../uiHelper.ts';

const SolveTrackerAnonymous = memo(function SolveTracker() {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();
  const { state } = useGridState();

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
              await deferredRedirect.setAndNavigate(router.state.location, {
                to: '/auth',
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

const PuzzleCompleted = memo(function PuzzleCompleted({
  initialRating,
  openComments,
  setOpenComments,
}: {
  initialRating: number;
  openComments: boolean;
  setOpenComments: (open: boolean) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { me } = useOnline();
  const { id } = useOnlinePuzzle();
  const commentCount = useQuery({
    ...commentCountQueryOptions(id!),
    enabled: !!id && !!me,
  });
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
        <div className="text-2xl">Puzzle solved!</div>
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

const SolveTrackerSignedIn = memo(function SolveTracker() {
  const { isOnline, me } = useOnline();
  const { id } = useOnlinePuzzle();
  const completionBegin = useQuery({
    queryKey: ['completion', 'begin', id],
    queryFn: () => api.completionBegin(id!),
    enabled: isOnline && !!me && !!id,
  });

  const msElapsedTime = useRef<number>(0);
  // eslint-disable-next-line react-hooks/purity
  const activeStartTick = useRef<number>(Date.now());

  useEffect(() => {
    const eventHandler = () => {
      console.log('Visibility changed');
      if (document.visibilityState === 'hidden') {
        msElapsedTime.current += Date.now() - activeStartTick.current;
        if (id) onlineSolveTracker.sendSolving(id, msElapsedTime.current);
        msElapsedTime.current = 0;
      } else {
        activeStartTick.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', eventHandler, false);
    return () => {
      document.removeEventListener('visibilitychange', eventHandler);
    };
  }, [id, isOnline, me]);

  const commentCount = useQuery({
    ...commentCountQueryOptions(id!),
    enabled: !!id && !!me,
  });

  const { state } = useGridState();
  const [openComments, setOpenComments] = useState(false);

  useEffect(() => {
    if (!isOnline || !me || !id) return;
    if (State.isSatisfied(state.final)) {
      msElapsedTime.current += Date.now() - activeStartTick.current;
      void onlineSolveTracker
        .completeSolve(id, msElapsedTime.current)
        .then(async newSolve => {
          if (newSolve)
            await queryClient.refetchQueries({
              queryKey: ['puzzle', 'solve', id],
            });
        });
      msElapsedTime.current = 0;
    }
  }, [isOnline, me, id, state.final]);

  if (!isOnline || !me || !id) return null;

  if (completionBegin.isPending) {
    return (
      <div className="flex p-2 ps-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between">
        <Loading />
      </div>
    );
  }

  if (!completionBegin.data!.solvedAt && !State.isSatisfied(state.final)) {
    return (
      <div className="flex p-2 ps-4 leading-8 rounded-2xl shadow-md bg-base-100 text-base-content items-center justify-between">
        Unsolved puzzle
        <CommentSidebar
          open={openComments}
          onClose={() => setOpenComments(false)}
          key="commentSidebar"
        />
        <button
          className="btn btn-sm btn-ghost"
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
  }

  return (
    <PuzzleCompleted
      initialRating={completionBegin.data!.ratedDifficulty ?? 0}
      openComments={openComments}
      setOpenComments={setOpenComments}
    />
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

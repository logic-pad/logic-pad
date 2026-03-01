import { memo } from 'react';
import RatedDifficulty from './RatedDifficulty';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import { useOnline } from '../contexts/OnlineContext';
import { useQuery } from '@tanstack/react-query';
import { puzzleSolveQueryOptions } from '../routes/_layout.solve.$puzzleId';
import Loading from '../components/Loading';
import { FaCheckSquare, FaHeart } from 'react-icons/fa';
import { pluralize } from '../uiHelper';

export default memo(function OnlineMetadata() {
  const { isOnline } = useOnline();
  const { id } = useOnlinePuzzle();
  const puzzle = useQuery(puzzleSolveQueryOptions(id));
  if (!isOnline || !id) return null;
  if (puzzle.isPending) {
    return <Loading />;
  }
  return (
    <>
      <aside className="flex gap-2">
        <span className="badge badge-ghost badge-lg p-4 bg-base-100 text-base-content border-0">
          <FaCheckSquare className="inline-block me-2" aria-hidden="true" />
          {pluralize(puzzle.data!.solveCount)`solve``solves`}
        </span>
        <span className="badge badge-ghost badge-lg p-4 bg-base-100 text-base-content border-0">
          <FaHeart className="inline-block me-2" aria-hidden="true" />
          {pluralize(puzzle.data!.loveCount)`love``loves`}
        </span>
      </aside>
      <RatedDifficulty
        key="ratedDifficulty"
        ratedDifficulty={puzzle.data!.ratedDifficulty}
        collapsible={true}
      />
    </>
  );
});

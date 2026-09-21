import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { onlinePuzzleAtom } from '../state/onlinePuzzle.ts';
import { useQuery } from '@tanstack/react-query';
import { RiPlayList2Fill } from 'react-icons/ri';
import { collectionQueryOptions } from '../routes/_layout.collection.$collectionId.tsx';
import Loading from '../components/Loading.tsx';
import { Link } from '@tanstack/react-router';
import { cn } from '../uiHelper.ts';
import { useResolvedCollectionId } from './CollectionPanel.tsx';
import { useSolveScreenContext } from '../screens/SolveScreenContext.ts';

export interface CollectionSidebarProps {
  collectionId?: string | null;
}

/**
 * Button shown in the solve screen sidebar when the current puzzle belongs to
 * a collection. Opens the collection panel in the same sidebar.
 */
export default memo(function CollectionButton({
  collectionId: collectionIdProp,
}: CollectionSidebarProps) {
  const { setPanel } = useSolveScreenContext();
  const puzzle = useAtomValue(onlinePuzzleAtom);
  const collectionId = useResolvedCollectionId(collectionIdProp);
  const collection = useQuery({
    ...collectionQueryOptions(collectionId!),
    enabled: !!collectionId,
  });

  if (!puzzle || !collectionId) return null;

  if (collection.isPending) return <Loading className="h-8" />;
  if (!collection.data) return null;

  return (
    <>
      <button
        className={cn(
          'btn btn-ghost h-fit gap-4 justify-start text-start',
          puzzle.series && puzzle.series.id === collectionId && 'text-accent'
        )}
        onClick={() => setPanel('collection')}
      >
        <RiPlayList2Fill size={24} className="shrink-0" />
        <div className="flex flex-col items-start gap-1 h-fit">
          <span className="text-lg shrink-0">{collection.data.title}</span>
          {collection.data?.puzzleCount !== null && (
            <span className="opacity-80 shrink-0">
              {collection.data?.puzzleCount} puzzles
            </span>
          )}
        </div>
      </button>
      {puzzle.series && puzzle.series.id !== collectionId && (
        <div className="text-sm opacity-80 mt-2">
          Also part of the{' '}
          <Link
            to="/solve/$puzzleId"
            params={{ puzzleId: puzzle.id }}
            search={{ collection: puzzle.series.id }}
            className="link link-accent"
          >
            {puzzle.series.title.length === 0
              ? 'Untitled Collection'
              : puzzle.series.title}
          </Link>{' '}
          series
        </div>
      )}
    </>
  );
});

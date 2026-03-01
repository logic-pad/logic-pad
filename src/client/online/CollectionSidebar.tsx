import React, { memo, useEffect, useId } from 'react';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, bidirectionalInfiniteQuery } from './api';
import { RiPlayList2Fill } from 'react-icons/ri';
import { collectionQueryOptions } from '../routes/_layout.collection.$collectionId';
import Loading from '../components/Loading';
import { PuzzleIcon } from './PuzzleCard';
import { Link } from '@tanstack/react-router';
import UserCard from '../metadata/UserCard';
import Difficulty from '../metadata/Difficulty';
import { cn } from '../uiHelper';
import { useOnline } from '../contexts/OnlineContext';
import { ResourceStatus } from './data';
import { router } from '../router/router';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';

export interface CollectionSidebarProps {
  collectionId?: string | null;
}

export default memo(function CollectionSidebar({
  collectionId,
}: CollectionSidebarProps) {
  const drawerId = useId();
  const { me } = useOnline();
  const { id, puzzle } = useOnlinePuzzle();
  collectionId ??= puzzle?.series?.id;
  const collection = useQuery({
    ...collectionQueryOptions(collectionId!),
    enabled: !!collectionId,
  });
  const puzzleList = useInfiniteQuery({
    ...bidirectionalInfiniteQuery(
      ['collection', collectionId, 'puzzles', 'sidebar', puzzle?.id],
      (cursorBefore, cursorAfter) =>
        api.listCollectionPuzzles(
          collectionId!,
          undefined,
          cursorBefore,
          cursorAfter
        ),
      false
    ),
    initialData: {
      pages: [
        {
          total: 1,
          results: [puzzle!],
        },
      ],
      pageParams: [undefined],
    },
    enabled: !!collectionId && !!id,
  });
  useEffect(() => {
    if (!collectionId || !id) return;
    if (!puzzleList.isFetching && puzzleList.error === null) {
      if (puzzleList.data?.pages.length === 1) {
        void (async () => {
          if (puzzleList.hasNextPage) await puzzleList.fetchNextPage();
          else if (puzzleList.hasPreviousPage)
            await puzzleList.fetchPreviousPage();
        })();
      } else if (
        puzzleList.data?.pages.length === 2 &&
        puzzleList.data.pageParams[0] === undefined
      ) {
        if (puzzleList.hasPreviousPage) void puzzleList.fetchPreviousPage();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleList.isFetching]);

  if (!id || !puzzle || !collectionId || !collection.data) return null;

  if (collection.isPending) return <Loading className="h-8" />;

  return (
    <>
      <div className="drawer">
        <input
          id={`collection-sidebar-${drawerId}`}
          type="checkbox"
          className="drawer-toggle"
        />
        <label
          htmlFor={`collection-sidebar-${drawerId}`}
          className={cn(
            'drawer-content btn btn-ghost drawer-button -ml-4 h-fit gap-4 text-neutral-content rounded-none rounded-r-lg justify-start',
            puzzle.series && puzzle.series.id === collectionId && 'text-accent'
          )}
        >
          <RiPlayList2Fill size={24} />
          <div className="flex flex-col items-start gap-1 h-fit">
            <span className="text-lg shrink-0">{collection.data.title}</span>
            {collection.data?.puzzleCount !== null && (
              <span className="text-neutral-content opacity-80 shrink-0">
                {collection.data?.puzzleCount} puzzles
              </span>
            )}
          </div>
        </label>
        <div className="drawer-side overflow-x-visible! overflow-y-visible! z-50 h-full w-full">
          <label
            htmlFor={`collection-sidebar-${drawerId}`}
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <div className="h-full w-full pointer-events-none">
            <div className="h-full w-[350px] max-w-full shrink-0 grow-0 flex flex-col items-center p-4 bg-neutral text-neutral-content self-stretch pointer-events-auto">
              <div className="flex flex-col gap-2 items-start w-full">
                <Link
                  to="/collection/$collectionId"
                  params={{ collectionId }}
                  className="btn btn-ghost flex flex-col flex-nowrap gap-2 items-start text-start *:shrink-0 h-fit w-full px-2 -mx-2"
                >
                  <div className="text-accent text-sm uppercase">
                    {puzzle.series && puzzle.series.id === collectionId
                      ? 'Puzzle series'
                      : 'Collection'}
                  </div>
                  <div className="text-2xl">{collection.data.title}</div>
                </Link>
                <UserCard user={collection.data.creator} />
                <div className="max-h-72 overflow-y-auto">
                  {collection.data.description}
                </div>
              </div>
              <div className="divider" />
              <div className="flex flex-col items-center w-full overflow-y-auto flex-1 *:shrink-0">
                {puzzleList.isFetchingPreviousPage ? (
                  <Loading className="h-4 m-4 shrink-0" />
                ) : puzzleList.hasPreviousPage ? (
                  <InfiniteScrollTrigger
                    onLoadMore={async () =>
                      await puzzleList.fetchPreviousPage()
                    }
                    autoTrigger={false}
                    direction="up"
                    className="btn-sm btn-neutral w-fit"
                  />
                ) : null}
                {puzzleList.data?.pages.flatMap(page =>
                  page.results.map(puzzle => (
                    <React.Fragment key={puzzle.id}>
                      <Link
                        key={puzzle.id}
                        className={cn(
                          'btn w-full h-fit flex flex-row flex-nowrap gap-2 py-2 items-center justify-start text-start wrapper',
                          puzzle.id === id ? '' : 'btn-ghost',
                          puzzle.status === ResourceStatus.Private &&
                            puzzle.creator.id !== me?.id &&
                            'btn-disabled'
                        )}
                        to={
                          puzzle.status === ResourceStatus.Private &&
                          puzzle.creator.id === me?.id
                            ? '/create/$puzzleId'
                            : '.'
                        }
                        params={{ puzzleId: puzzle.id }}
                        search={{
                          collection: router.state.location.search.collection,
                        }}
                      >
                        <PuzzleIcon
                          types={puzzle.types}
                          size={36}
                          className={cn(
                            'shrink-0',
                            puzzle.id === id
                              ? ''
                              : 'bg-neutral! [.wrapper:hover_&]:bg-base-content/0! transition-colors [.wrapper:hover_&]:transition-none'
                          )}
                        />
                        <div className="flex flex-col items-start gap-2">
                          <h2 className="text-lg font-normal">
                            {puzzle.title.length === 0
                              ? 'Untitled Puzzle'
                              : puzzle.title}
                          </h2>
                          <div className="badge badge-md">
                            {puzzle.creator.name}
                          </div>
                          <Difficulty
                            value={puzzle.designDifficulty}
                            size="sm"
                          />
                        </div>
                      </Link>
                      <div className="divider m-0" />
                    </React.Fragment>
                  ))
                )}
                {puzzleList.isFetchingNextPage ? (
                  <Loading className="h-4 m-4 shrink-0" />
                ) : puzzleList.hasNextPage ? (
                  <InfiniteScrollTrigger
                    onLoadMore={async () => await puzzleList.fetchNextPage()}
                    className="btn-sm btn-neutral w-fit"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
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

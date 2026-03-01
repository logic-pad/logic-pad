import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { memo, useState } from 'react';
import { FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { api, queryClient } from '../online/api';
import PuzzleCard from '../online/PuzzleCard';
import Loading from '../components/Loading';
import { useRouteProtection } from '../router/useRouteProtection';
import PuzzleSearchQuery from '../online/PuzzleSearchQuery';
import toast from 'react-hot-toast';
import { cn } from '../uiHelper';
import { ResourceStatus } from '../online/data';
import { FaXmark } from 'react-icons/fa6';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import { searchOwnPuzzlesInfiniteQueryOptions } from '../online/PuzzleSearchResults';

export const Route = createLazyFileRoute('/_layout/my-stuff/puzzles')({
  component: memo(function MyStuff() {
    useRouteProtection('login');
    const navigate = Route.useNavigate();
    const search = Route.useSearch();
    const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
      searchOwnPuzzlesInfiniteQueryOptions(search)
    );
    const deletePuzzles = useMutation({
      mutationFn: (variables: Parameters<typeof api.deletePuzzles>) => {
        return api.deletePuzzles(...variables);
      },
      onError(error) {
        toast.error(error.message);
      },
      async onSuccess(data) {
        await queryClient.invalidateQueries({
          queryKey: ['puzzle', 'search-own'],
        });
        toast.success(`Successfully deleted ${data.deleted.length} puzzles`);
      },
    });
    const [selectedPuzzles, setSelectedPuzzles] = useState<string[] | null>(
      null
    );

    return (
      <>
        <div role="tablist" className="tabs tabs-lg tabs-border">
          <Link
            to="/my-stuff/puzzles"
            role="tab"
            className="tab tab-active text-neutral-content"
          >
            Puzzles
          </Link>
          <Link
            to="/my-stuff/collections"
            role="tab"
            className="tab text-neutral-content"
          >
            Collections
          </Link>
        </div>
        <PuzzleSearchQuery
          params={search}
          searchType="own"
          onChange={async params => await navigate({ search: params })}
        />
        <div className="flex gap-4 items-center w-full justify-end shrink-0">
          {deletePuzzles.isPending ? (
            <Loading className="h-8 w-24" />
          ) : selectedPuzzles === null ? (
            <button
              className="btn btn-sm"
              onClick={() => setSelectedPuzzles([])}
            >
              <FaTrash size={16} />
              Delete private puzzles
            </button>
          ) : (
            <>
              <div>Select puzzles to be removed</div>
              <button
                className={cn(
                  'btn btn-sm',
                  selectedPuzzles?.length > 0 ? 'btn-error' : 'btn-disabled'
                )}
                onClick={async () => {
                  if (selectedPuzzles.length > 0) {
                    await deletePuzzles.mutateAsync([selectedPuzzles]);
                  }
                  setSelectedPuzzles(null);
                }}
              >
                <FaTrash size={16} />
                Delete puzzles
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setSelectedPuzzles(null)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
        <div className="divider m-0" />
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-wrap gap-4 justify-center">
            {data?.pages.flatMap(page =>
              page.results.map(puzzle => (
                <PuzzleCard
                  key={puzzle.id}
                  puzzle={puzzle}
                  to={
                    selectedPuzzles === null ? '/create/$puzzleId' : undefined
                  }
                  params={
                    selectedPuzzles === null
                      ? { puzzleId: puzzle.id }
                      : undefined
                  }
                  onClick={
                    selectedPuzzles !== null
                      ? () => {
                          if (puzzle.status === ResourceStatus.Private) {
                            setSelectedPuzzles(selection => {
                              if (selection?.includes(puzzle.id)) {
                                return selection.filter(id => id !== puzzle.id);
                              }
                              if ((selection?.length ?? 0) >= 100) {
                                toast.error(
                                  'You can select up to 100 puzzles at a time'
                                );
                                return selection;
                              }
                              return [...(selection ?? []), puzzle.id];
                            });
                          }
                        }
                      : undefined
                  }
                >
                  {selectedPuzzles !== null && (
                    <div
                      className={cn(
                        'absolute bottom-0 right-0 w-10 h-10 flex justify-center items-center rounded-tl-xl rounded-br-xl',
                        selectedPuzzles.includes(puzzle.id)
                          ? 'bg-accent text-accent-content'
                          : 'bg-base-100 text-base-content'
                      )}
                    >
                      {puzzle.status !== ResourceStatus.Private ? (
                        <FaXmark size={24} className="opacity-50" />
                      ) : selectedPuzzles.includes(puzzle.id) ? (
                        <FaCheck size={24} />
                      ) : (
                        <FaPlus size={24} />
                      )}
                    </div>
                  )}
                </PuzzleCard>
              ))
            )}
          </div>
          {isFetching ? (
            <Loading className="h-fit" />
          ) : hasNextPage ? (
            <InfiniteScrollTrigger
              onLoadMore={async () => await fetchNextPage()}
            />
          ) : null}
        </div>
      </>
    );
  }),
});

import {
  createLazyFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { memo, ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import {
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaExchangeAlt,
  FaListOl,
  FaListUl,
  FaPlus,
  FaTrash,
  FaUser,
} from 'react-icons/fa';
import {
  mutationOptions,
  useMutation,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import PuzzleCard from '../online/PuzzleCard';
import Loading from '../components/Loading';
import { useRouteProtection } from '../router/useRouteProtection';
import {
  collectionInfiniteQueryOptions,
  collectionQueryOptions,
} from './_layout.collection.$collectionId';
import UserCard from '../metadata/UserCard';
import { cn, pluralize, toRelativeDate } from '../uiHelper';
import CollectionFollowButton from '../online/CollectionFollowButton';
import {
  AutoCollection,
  CollectionBrief,
  PuzzleBrief,
  ResourceStatus,
} from '../online/data';
import { api, queryClient } from '../online/api';
import toast from 'react-hot-toast';
import { useOnline } from '../contexts/OnlineContext';
import EditableField from '../components/EditableField';
import AddPuzzlesModal from '../online/AddPuzzlesModal';
import { BiSolidSelectMultiple } from 'react-icons/bi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Avatar from '../online/Avatar';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import Skeleton from '../components/Skeleton';
import { TbLayoutGrid } from 'react-icons/tb';

interface CollectionPuzzlesProps {
  collectionBrief: CollectionBrief;
  editable: boolean;
}

const CollectionPuzzles = memo(function CollectionPuzzles({
  collectionBrief,
  editable,
}: CollectionPuzzlesProps) {
  const { sort } = useSearch({ from: '/_layout/collection/$collectionId' });
  const navigate = useNavigate({ from: '/collection/$collectionId' });
  const { me } = useOnline();
  const {
    data: puzzles,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useSuspenseInfiniteQuery(
    collectionInfiniteQueryOptions(collectionBrief.id, sort)
  );
  const [puzzleList, setPuzzleList] = useState<PuzzleBrief[]>(
    puzzles.pages.flatMap(p => p.results)
  );
  useEffect(() => {
    setPuzzleList(puzzles.pages.flatMap(p => p.results));
  }, [puzzles]);
  const reorderCollection = useMutation({
    mutationKey: ['collection', collectionBrief.id, 'reorder'],
    mutationFn: (variables: Parameters<typeof api.reorderCollection>) => {
      return api.reorderCollection(...variables);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['collection', collectionBrief.id, 'puzzles'],
      });
    },
    onError(error) {
      toast.error(error.message);
      setPuzzleList(puzzles.pages.flatMap(p => p.results));
    },
    async onSettled() {
      if (
        queryClient.isMutating({
          mutationKey: ['collection', collectionBrief.id, 'reorder'],
        }) === 1
      )
        await queryClient.invalidateQueries({
          queryKey: ['collection', collectionBrief.id, 'puzzles'],
        });
    },
  });
  const addToCollection = useMutation({
    mutationFn: (variables: Parameters<typeof api.addToCollection>) => {
      return api.addToCollection(...variables);
    },
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ['collection', collectionBrief.id],
      });
    },
  });
  const removeFromCollection = useMutation({
    mutationFn: (variables: Parameters<typeof api.removeFromCollection>) => {
      return api.removeFromCollection(...variables);
    },
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ['collection', collectionBrief.id],
      });
    },
  });
  const addPuzzlesModalRef = useRef<{ open: () => void }>(null);
  const [selectedPuzzles, setSelectedPuzzles] = useState<string[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const draggableWrapper = editable
    ? (children: ReactNode) => (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              const newList = [...puzzleList];
              const movingIndex = newList.findIndex(p => p.id === active.id);
              const replacingIndex = newList.findIndex(p => p.id === over.id);
              if (movingIndex === replacingIndex) {
                return;
              }
              const [moving] = newList.splice(movingIndex, 1);
              newList.splice(replacingIndex, 0, moving);
              setPuzzleList(newList);
              reorderCollection.mutate([
                collectionBrief.id,
                active.id as string,
                over.id as string,
              ]);
            }
          }}
        >
          <SortableContext items={puzzleList} strategy={rectSortingStrategy}>
            {children}
          </SortableContext>
        </DndContext>
      )
    : (children: ReactNode) => children;

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex gap-4 items-center w-full justify-end shrink-0">
        <button
          className="btn"
          onClick={() =>
            navigate({
              search: {
                sort:
                  sort === 'desc' || (!sort && collectionBrief.autoPopulate)
                    ? 'asc'
                    : 'desc',
              },
            })
          }
        >
          Sort collection
          {sort === 'desc' || (!sort && collectionBrief.autoPopulate) ? (
            <FaChevronUp aria-label="Descending" />
          ) : (
            <FaChevronDown aria-label="Ascending" />
          )}
        </button>
        <div>
          {collectionBrief.autoPopulate
            ? 'Automatic collection'
            : `${collectionBrief.puzzleCount} puzzles`}
        </div>
        {editable && (
          <>
            <div className="flex-1" />
            <div>
              {reorderCollection.isPending
                ? 'Reordering...'
                : 'Drag and drop to reorder'}
            </div>
            {addToCollection.isPending ? (
              <Loading className="h-12 w-24" />
            ) : (
              <button
                className="btn"
                onClick={() => addPuzzlesModalRef.current?.open()}
              >
                <FaPlus size={16} />
                Add puzzles
              </button>
            )}
            <AddPuzzlesModal
              ref={addPuzzlesModalRef}
              searchType={
                collectionBrief.status === ResourceStatus.Public
                  ? 'public'
                  : 'all'
              }
              modifyParams={
                collectionBrief.isSeries
                  ? p => ({
                      ...p,
                      q: `${p.q ?? ''} creator=${me?.id} series=null`,
                    })
                  : undefined
              }
              onSubmit={async puzzles => {
                await addToCollection.mutateAsync([
                  collectionBrief.id,
                  puzzles,
                ]);
              }}
            />
            <div className="divider divider-horizontal mx-0" />
            {removeFromCollection.isPending ? (
              <Loading className="h-12 w-24" />
            ) : selectedPuzzles === null ? (
              <button className="btn" onClick={() => setSelectedPuzzles([])}>
                <BiSolidSelectMultiple size={16} />
                Select puzzles
              </button>
            ) : (
              <>
                <button
                  className="btn"
                  onClick={() => setSelectedPuzzles(null)}
                >
                  Cancel
                </button>
                <button
                  className={cn(
                    'btn',
                    selectedPuzzles?.length > 0 ? 'btn-error' : 'btn-disabled'
                  )}
                  onClick={async () => {
                    if (selectedPuzzles.length > 0) {
                      await removeFromCollection.mutateAsync([
                        collectionBrief.id,
                        selectedPuzzles,
                      ]);
                    }
                    setSelectedPuzzles(null);
                  }}
                >
                  <FaTrash size={16} />
                  Remove selected
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {draggableWrapper(
          puzzleList.map(puzzle => (
            <PuzzleCard
              key={puzzle.id}
              dragDroppable={editable}
              puzzle={puzzle}
              to={
                selectedPuzzles === null
                  ? puzzle.status === ResourceStatus.Private &&
                    puzzle.creator.id === me?.id
                    ? `/create/$puzzleId`
                    : `/solve/$puzzleId`
                  : undefined
              }
              params={{ puzzleId: puzzle.id }}
              search={{ collection: collectionBrief.id }}
              onClick={
                selectedPuzzles !== null
                  ? () => {
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
                  {selectedPuzzles.includes(puzzle.id) ? (
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
        <InfiniteScrollTrigger onLoadMore={async () => await fetchNextPage()} />
      ) : null}
    </div>
  );
});

const updateCollectionOptions = (collectionId: string) =>
  mutationOptions({
    mutationKey: ['collection', collectionId, 'update'],
    mutationFn: (variables: Parameters<typeof api.updateCollection>) => {
      return api.updateCollection(...variables);
    },
    onMutate: async (variables: Parameters<typeof api.updateCollection>) => {
      await queryClient.cancelQueries({
        queryKey: ['collection', collectionId, 'info'],
      });
      const previousCollection = queryClient.getQueryData<CollectionBrief>([
        'collection',
        collectionId,
        'info',
      ])!;
      queryClient.setQueryData(['collection', collectionId, 'info'], {
        ...previousCollection,
        title: variables[1] ?? previousCollection.title,
        description: variables[2] ?? previousCollection.description,
        status: variables[3] ?? previousCollection.status,
      });
      return { previousCollection };
    },
    onError(error, _variables, context) {
      toast.error(error.message);
      if (context)
        queryClient.setQueryData(
          ['collection', collectionId, 'info'],
          context.previousCollection
        );
    },
    onSettled(_data, _error) {
      if (
        queryClient.isMutating({
          mutationKey: ['collection', collectionId, 'update'],
        }) === 1
      )
        void queryClient.invalidateQueries({
          queryKey: ['collection', collectionId, 'info'],
        });
    },
  });

export const Route = createLazyFileRoute('/_layout/collection/$collectionId')({
  component: memo(function Collection() {
    useRouteProtection('online');
    const navigate = Route.useNavigate();
    const params = Route.useParams();
    const { me } = useOnline();
    const { data: collectionBrief } = useSuspenseQuery(
      collectionQueryOptions(params.collectionId)
    );
    const updateCollection = useMutation(
      updateCollectionOptions(params.collectionId)
    );
    const deleteCollection = useMutation({
      mutationFn: (collectionId: string) => {
        return api.deleteCollection(collectionId);
      },
      onError(error) {
        toast.error(error.message);
      },
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: ['collection', 'search-own', {}],
        });
        await navigate({ to: '/my-stuff/collections' });
      },
    });

    return (
      <ResponsiveLayout>
        <section className="flex items-center text-3xl mt-8 flex-wrap gap-4 justify-between">
          <div
            className={cn(
              'flex items-center',
              collectionBrief.isSeries && 'text-accent font-semibold'
            )}
          >
            {collectionBrief.autoPopulate === AutoCollection.CreatedPuzzles ? (
              <Avatar
                userId={collectionBrief.creator.id}
                username={collectionBrief.creator.name}
                className="w-[32px] h-[32px] inline-block aspect-square me-4 shrink-0"
              />
            ) : collectionBrief.isSeries ? (
              <FaListOl size={32} className="inline-block me-4 shrink-0" />
            ) : (
              <FaListUl size={32} className="inline-block me-4 shrink-0" />
            )}
            <EditableField
              initialValue={collectionBrief.title}
              editable={collectionBrief.creator.id === me?.id}
              pending={updateCollection.isPending}
              onEdit={async newValue => {
                await updateCollection.mutateAsync([
                  params.collectionId,
                  newValue,
                ]);
              }}
            />
          </div>
          {collectionBrief.creator.id === me?.id && (
            <div className="flex justify-end items-center bg-base-100 rounded-lg overflow-hidden shrink-0">
              {collectionBrief.autoPopulate === null && (
                <button
                  className={cn(
                    'tooltip tooltip-right btn rounded-none',
                    collectionBrief.isSeries
                      ? 'btn-ghost bg-base-300 text-base-content tooltip-info'
                      : 'btn-accent tooltip-accent'
                  )}
                  data-tip={
                    collectionBrief.isSeries
                      ? 'Convert to collection'
                      : 'Convert to puzzle series'
                  }
                  onClick={async () => {
                    await updateCollection.mutateAsync([
                      params.collectionId,
                      undefined,
                      undefined,
                      undefined,
                      !collectionBrief.isSeries,
                    ]);
                    await queryClient.invalidateQueries({
                      queryKey: ['collection', params.collectionId, 'puzzles'],
                    });
                  }}
                >
                  <FaExchangeAlt size={16} />
                </button>
              )}
              <fieldset className="fieldset mx-4">
                <label className="label cursor-pointer flex gap-2">
                  <span className="label-text">Public collection</span>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={collectionBrief.status === ResourceStatus.Public}
                    onChange={async e => {
                      await updateCollection.mutateAsync([
                        params.collectionId,
                        undefined,
                        undefined,
                        e.target.checked
                          ? ResourceStatus.Public
                          : ResourceStatus.Private,
                      ]);
                    }}
                  />
                </label>
              </fieldset>
              {collectionBrief.autoPopulate === null && (
                <button
                  className="tooltip tooltip-error tooltip-left btn btn-error rounded-none"
                  data-tip="Delete this collection"
                  onClick={() =>
                    (
                      document.getElementById(
                        'deleteCollectionModal'
                      ) as HTMLDialogElement
                    ).showModal()
                  }
                >
                  <FaTrash size={16} />
                </button>
              )}
              <dialog id="deleteCollectionModal" className="modal">
                <div className="modal-box">
                  <h3 className="font-bold text-xl">
                    Are you sure you want to delete this collection?
                  </h3>
                  {deleteCollection.isPending ? (
                    <div className="modal-action">
                      <Loading />
                    </div>
                  ) : (
                    <div className="modal-action">
                      <button
                        className="btn"
                        onClick={() =>
                          (
                            document.getElementById(
                              'deleteCollectionModal'
                            ) as HTMLDialogElement
                          ).close()
                        }
                      >
                        No
                      </button>
                      <button
                        className="btn btn-error"
                        onClick={async () => {
                          await deleteCollection.mutateAsync(
                            params.collectionId
                          );
                        }}
                      >
                        Yes
                      </button>
                    </div>
                  )}
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button>close</button>
                </form>
              </dialog>
            </div>
          )}
        </section>
        <UserCard user={collectionBrief.creator} />
        <div className="flex gap-4 items-center flex-wrap">
          {collectionBrief.puzzleCount !== null && (
            <span className="badge badge-ghost badge-lg p-4 bg-base-100 text-base-content border-0">
              <TbLayoutGrid className="inline-block me-2" size={14} />
              {pluralize(collectionBrief.puzzleCount)`puzzle``puzzles`}
            </span>
          )}
          {collectionBrief.status === ResourceStatus.Public && (
            <span className="badge badge-ghost badge-lg p-4 bg-base-100 text-base-content border-0">
              <FaUser className="inline-block me-2" size={14} />
              {pluralize(collectionBrief.followCount)`follow``follows`}
            </span>
          )}
          <span className="opacity-80">
            Created {toRelativeDate(new Date(collectionBrief.createdAt))}
          </span>
          <span className="opacity-80">
            Updated {toRelativeDate(new Date(collectionBrief.modifiedAt))}
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <EditableField
            className="flex-1"
            initialValue={collectionBrief.description}
            editable={collectionBrief.creator.id === me?.id}
            pending={updateCollection.isPending}
            onEdit={async newValue => {
              await updateCollection.mutateAsync([
                params.collectionId,
                undefined,
                newValue,
              ]);
            }}
          />
          {collectionBrief.status === ResourceStatus.Public ? (
            <CollectionFollowButton collectionId={collectionBrief.id} />
          ) : (
            <div className="btn btn-disabled">Private collection</div>
          )}
        </div>
        <div className="divider" />
        <Suspense
          fallback={
            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-4 items-center w-full justify-end shrink-0">
                <Skeleton className="w-36 h-10" />
                <div className="flex-1" />
                {collectionBrief.creator.id === me?.id &&
                  collectionBrief.autoPopulate === null && (
                    <>
                      <Skeleton className="w-28 h-10" />
                      <Skeleton className="w-28 h-10" />
                    </>
                  )}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="w-[320px] h-[116px]" />
                ))}
              </div>
            </div>
          }
        >
          <CollectionPuzzles
            collectionBrief={collectionBrief}
            editable={
              collectionBrief.creator.id === me?.id &&
              collectionBrief.autoPopulate === null
            }
          />
        </Suspense>
      </ResponsiveLayout>
    );
  }),
});

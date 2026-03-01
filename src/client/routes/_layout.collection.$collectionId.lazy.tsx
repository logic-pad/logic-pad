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
import { TbLayoutGrid, TbReorder } from 'react-icons/tb';

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

const CollectionFollow = memo(function FollowButton({
  collectionBrief,
}: {
  collectionBrief: CollectionBrief;
}) {
  if (collectionBrief.status !== ResourceStatus.Private)
    return <CollectionFollowButton collectionId={collectionBrief.id} />;
  else return <div className="btn btn-disabled">Private collection</div>;
});

const CollectionMeta = memo(function CollectionMeta({
  collectionBrief,
}: {
  collectionBrief: CollectionBrief;
}) {
  return (
    <div className="flex flex-col gap-4">
      <UserCard user={collectionBrief.creator} />
      <div className="flex gap-4 items-center flex-wrap">
        {collectionBrief.puzzleCount !== null && (
          <span className="badge badge-ghost badge-lg p-4 bg-base-100 text-base-content border-0">
            <TbLayoutGrid className="inline-block me-2" size={14} />
            {pluralize(collectionBrief.puzzleCount)`puzzle``puzzles`}
          </span>
        )}
        {collectionBrief.status !== ResourceStatus.Private && (
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
    </div>
  );
});

const CollectionTitle = memo(function CollectionTitle({
  collectionBrief,
}: {
  collectionBrief: CollectionBrief;
}) {
  const { isPending, mutate: updateCollection } = useMutation(
    updateCollectionOptions(collectionBrief.id)
  );
  const { me } = useOnline();

  return (
    <div
      className={cn(
        'flex items-center text-3xl mt-8 gap-4',
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
        pending={isPending}
        onEdit={newValue => {
          updateCollection([collectionBrief.id, newValue]);
        }}
      />
    </div>
  );
});

const CollectionDescription = memo(function CollectionDescription({
  collectionBrief,
}: {
  collectionBrief: CollectionBrief;
}) {
  const { isPending, mutate: updateCollection } = useMutation(
    updateCollectionOptions(collectionBrief.id)
  );
  const { me } = useOnline();
  return (
    <EditableField
      className="flex-1"
      initialValue={collectionBrief.description}
      editable={collectionBrief.creator.id === me?.id}
      pending={isPending}
      onEdit={newValue => {
        updateCollection([collectionBrief.id, undefined, newValue]);
      }}
    />
  );
});

const CollectionControls = memo(function CollectionControls({
  collectionBrief,
}: {
  collectionBrief: CollectionBrief;
}) {
  const { me } = useOnline();
  const navigate = useNavigate({ from: '/collection/$collectionId' });
  const { isPending: isPendingUpdate, mutateAsync: updateCollection } =
    useMutation(updateCollectionOptions(collectionBrief.id));
  const { isPending: isPendingDelete, mutateAsync: deleteCollection } =
    useMutation({
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
  if (!me || collectionBrief.creator.id !== me.id) return null;
  return (
    <div
      className={cn(
        'menu menu-horizontal w-full bg-base-100 rounded-box gap-4',
        (isPendingUpdate || isPendingDelete) &&
          'pointer-events-none opacity-70 transition-opacity'
      )}
    >
      <line>
        <span className="mx-2">Access:</span>
        <select
          defaultValue={collectionBrief.status}
          className="select select-sm capitalize w-30 inline"
          onChange={async e => {
            await updateCollection([
              collectionBrief.id,
              undefined,
              undefined,
              e.target.value as ResourceStatus,
            ]);
          }}
        >
          {Object.values(ResourceStatus).map(status => (
            <option key={status} value={status} className="capitalize">
              {status}
            </option>
          ))}
        </select>
      </line>
      {collectionBrief.autoPopulate === null && (
        <li>
          <a
            type="button"
            className={cn(
              collectionBrief.isSeries ? 'text-base-content' : 'text-accent'
            )}
            onClick={async () => {
              await updateCollection([
                collectionBrief.id,
                undefined,
                undefined,
                undefined,
                !collectionBrief.isSeries,
              ]);
              await queryClient.invalidateQueries({
                queryKey: ['collection', collectionBrief.id, 'puzzles'],
              });
            }}
          >
            <FaExchangeAlt size={16} />{' '}
            {collectionBrief.isSeries
              ? 'Convert to collection'
              : 'Convert to puzzle series'}
          </a>
        </li>
      )}
      {collectionBrief.autoPopulate === null && (
        <li>
          <a
            type="button"
            className="text-error"
            onClick={() =>
              (
                document.getElementById(
                  'deleteCollectionModal'
                ) as HTMLDialogElement
              ).showModal()
            }
          >
            <FaTrash size={16} /> Delete this collection
          </a>
        </li>
      )}
      <dialog id="deleteCollectionModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-xl">
            Are you sure you want to delete this collection?
          </h3>
          {isPendingDelete ? (
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
                  await deleteCollection(collectionBrief.id);
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
      {(isPendingUpdate || isPendingDelete) && (
        <li className="flex-1 flex items-end">
          <Loading className="w-12 h-8" />
        </li>
      )}
    </div>
  );
});

const CollectionPuzzles = memo(function CollectionPuzzles({
  collectionBrief,
  editable,
}: {
  collectionBrief: CollectionBrief;
  editable: boolean;
}) {
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
  const { isPending: isPendingReorder, mutate: reorderCollection } =
    useMutation({
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
  const { isPending: isPendingAdd, mutateAsync: addToCollection } = useMutation(
    {
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
    }
  );
  const { isPending: isPendingRemove, mutateAsync: removeFromCollection } =
    useMutation({
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
  const [editMode, setEditMode] = useState<'reorder' | 'delete' | null>(null);
  const [selectedPuzzles, setSelectedPuzzles] = useState<string[]>([]);
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
  const draggableWrapper =
    editable && editMode === 'reorder'
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
                reorderCollection([
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
      <div className="flex gap-4 items-center flex-wrap w-full justify-end shrink-0">
        <button
          className="btn btn-sm"
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
        <div className="flex-1" />
        {editable &&
          (editMode === 'reorder' ? (
            <>
              <div>
                {isPendingReorder
                  ? 'Reordering...'
                  : 'Drag and drop to reorder'}
              </div>
              {isPendingReorder ? (
                <Loading className="h-8 w-24" />
              ) : (
                <button
                  className="btn btn-sm"
                  onClick={() => setEditMode(null)}
                >
                  Done
                </button>
              )}
            </>
          ) : editMode === 'delete' ? (
            <>
              <div>Select puzzles to be removed</div>
              {isPendingRemove ? (
                <Loading className="h-8 w-24" />
              ) : (
                <>
                  <button
                    className={cn(
                      'btn btn-sm',
                      selectedPuzzles.length > 0 ? 'btn-error' : 'btn-disabled'
                    )}
                    onClick={async () => {
                      if (selectedPuzzles.length > 0) {
                        await removeFromCollection([
                          collectionBrief.id,
                          selectedPuzzles,
                        ]);
                      }
                      setSelectedPuzzles([]);
                      setEditMode(null);
                    }}
                  >
                    <FaTrash size={16} />
                    Remove selected
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setSelectedPuzzles([]);
                      setEditMode(null);
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {isPendingAdd ? (
                <Loading className="h-8 w-24" />
              ) : (
                <button
                  className="btn btn-sm"
                  onClick={() => addPuzzlesModalRef.current?.open()}
                >
                  <FaPlus size={16} />
                  Add puzzles
                </button>
              )}
              <AddPuzzlesModal
                ref={addPuzzlesModalRef}
                searchType={
                  collectionBrief.status !== ResourceStatus.Private
                    ? 'published'
                    : 'all'
                }
                modifyParams={
                  collectionBrief.isSeries
                    ? p => ({
                        ...p,
                        q: `${p.q ?? ``} creator=${me?.id} series=null`,
                      })
                    : undefined
                }
                onSubmit={async puzzles => {
                  await addToCollection([collectionBrief.id, puzzles]);
                }}
              />
              <button
                className="btn btn-sm"
                onClick={() => {
                  setEditMode('reorder');
                }}
              >
                <TbReorder size={16} />
                Reorder puzzles
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setSelectedPuzzles([]);
                  setEditMode('delete');
                }}
              >
                <FaTrash size={16} />
                Delete puzzles
              </button>
            </>
          ))}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {draggableWrapper(
          puzzleList.map(puzzle => (
            <PuzzleCard
              key={puzzle.id}
              dragDroppable={editable && editMode === 'reorder'}
              puzzle={puzzle}
              to={
                editMode === null
                  ? puzzle.status === ResourceStatus.Private &&
                    puzzle.creator.id === me?.id
                    ? `/create/$puzzleId`
                    : `/solve/$puzzleId`
                  : undefined
              }
              params={{ puzzleId: puzzle.id }}
              search={{ collection: collectionBrief.id }}
              onClick={
                editMode === 'delete'
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
              {editMode === 'delete' && (
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

export const Route = createLazyFileRoute('/_layout/collection/$collectionId')({
  component: memo(function Collection() {
    useRouteProtection('online');
    const params = Route.useParams();
    const { me } = useOnline();
    const { data: collectionBrief } = useSuspenseQuery(
      collectionQueryOptions(params.collectionId)
    );

    return (
      <ResponsiveLayout>
        <CollectionTitle collectionBrief={collectionBrief} />
        {collectionBrief.description.length > 0 ||
        collectionBrief.creator.id === me?.id ? (
          <>
            <CollectionMeta collectionBrief={collectionBrief} />
            <div className="flex gap-4 flex-wrap items-center justify-between">
              <CollectionDescription collectionBrief={collectionBrief} />
              <CollectionFollow collectionBrief={collectionBrief} />
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-4 flex-wrap items-end justify-between">
              <CollectionMeta collectionBrief={collectionBrief} />
              <CollectionFollow collectionBrief={collectionBrief} />
            </div>
          </>
        )}
        <CollectionControls collectionBrief={collectionBrief} />
        <div className="divider" />
        <Suspense
          fallback={
            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-4 items-center w-full justify-end shrink-0">
                <Skeleton className="w-36 h-8" />
                <div className="flex-1" />
                {collectionBrief.creator.id === me?.id &&
                  collectionBrief.autoPopulate === null && (
                    <>
                      <Skeleton className="w-28 h-8" />
                      <Skeleton className="w-28 h-8" />
                      <Skeleton className="w-28 h-8" />
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

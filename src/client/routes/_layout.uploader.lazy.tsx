import { createLazyFileRoute, useBlocker } from '@tanstack/react-router';
import { memo, RefObject, useMemo, useRef, useSyncExternalStore } from 'react';
import { useRouteProtection } from '../router/useRouteProtection';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { FaExternalLinkAlt, FaTrash, FaUpload } from 'react-icons/fa';
import PQueue from 'p-queue';
import { r } from 'readable-regexp';
import Loading from '../components/Loading';
import Difficulty from '../metadata/Difficulty';
import PuzzleEditorModal, {
  PuzzleEditorRef,
} from '../editor/PuzzleEditorModal';
import {
  Puzzle,
  PuzzleMetadata,
  validatePuzzleChecklist,
} from '@logic-pad/core/data/puzzle';
import { cn } from '../uiHelper';
import toast from 'react-hot-toast';
import { useOnline } from '../contexts/OnlineContext';
import { api } from '../online/api';
import { allSolvers } from '@logic-pad/core/data/solver/allSolvers';
import GridData from '@logic-pad/core/data/grid';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import validateGrid from '@logic-pad/core/data/validate';

const defaultSolver = [...allSolvers.values()][0];

type SolutionStatus = 'missing' | 'manual' | 'unique' | 'multiple' | 'none';

interface DecodingData {
  data: string;
}

interface LocalData extends DecodingData {
  metadata: PuzzleMetadata;
  gridWithSolution: GridData;
  checklistStatus: boolean;
  solutionStatus: SolutionStatus;
  error?: string;
}

interface SolvingData extends LocalData {
  solverController: AbortController;
}

interface OnlineData extends LocalData {
  puzzleId: string;
}

interface DecodingEntry extends DecodingData {
  status: 'decoding';
}

interface MalformedEntry extends DecodingData {
  status: 'malformed';
}

interface LocalEntry extends LocalData {
  status: 'local';
}

interface SolvingEntry extends SolvingData {
  status: 'solving';
}

interface UploadingEntry extends LocalData {
  status: 'uploading';
}

interface OnlineEntry extends OnlineData {
  status: 'online';
}

type UploadEntry =
  | DecodingEntry
  | MalformedEntry
  | LocalEntry
  | SolvingEntry
  | UploadingEntry
  | OnlineEntry;

function getErrorMessage(checklistItem: string) {
  switch (checklistItem) {
    case 'metadataValid':
      return 'Invalid metadata';
    case 'gridValid':
      return 'Invalid grid size';
    case 'solutionIsNotEmpty':
      return 'Missing solution';
    case 'solutionIsComplete':
      return 'Incomplete solution';
    case 'solutionIsValid':
      return 'Invalid solution';
    default:
      return 'Unknown error';
  }
}

const linkRegex = r
  .match(
    r.exactly`http`.maybe`s`.exactly`://`,
    r.oneOrMore.charIn('-.', r.word),
    r.exactly`/`,
    r.oneOrMore.word,
    r.exactly`?`,
    r.zeroOrMore.charIn('=&', r.word),
    r.exactly`d=`,
    r.capture.oneOrMore.charIn('_%-', r.word)
  )
  .toRegExp('gm');

class UploadManager {
  private uploads: readonly UploadEntry[] = [];
  public taskQueue = new PQueue({
    concurrency: 5,
  });

  public uploadQueue = new PQueue({
    concurrency: 1,
    interval: 61 * 1000,
    intervalCap: 60,
  });

  private arrayListeners: (() => void)[] = [];
  private entryListeners: Record<string, (() => void)[]> = {};

  public subscribeToQueueIdle = (listener: () => void) => {
    this.taskQueue.on('idle', listener);
    this.taskQueue.on('add', listener);
    return () => {
      this.taskQueue.off('idle', listener);
      this.taskQueue.off('add', listener);
    };
  };

  public isQueueIdle = () => {
    return this.taskQueue.size === 0 && this.taskQueue.pending === 0;
  };

  public subscribeToArray = (listener: () => void) => {
    this.arrayListeners.push(listener);
    return () => {
      this.arrayListeners = this.arrayListeners.filter(l => l !== listener);
    };
  };

  public getUploads = () => {
    return this.uploads;
  };

  public subscribeToEntry = (data: string) => {
    return (listener: () => void) => {
      const entry = this.uploads.find(e => e.data === data);
      if (entry) {
        this.entryListeners[data] ??= [];
        this.entryListeners[data].push(listener);
        return () => {
          const entry = this.uploads.find(e => e.data === data);
          if (entry) {
            this.entryListeners[data] ??= [];
            this.entryListeners[data] = this.entryListeners[data].filter(
              l => l !== listener
            );
          }
        };
      }
      return () => {};
    };
  };

  public getEntry = (data: string) => () => {
    return this.uploads.find(e => e.data === data);
  };

  private enqueueDecode = (entry: UploadEntry) => {
    void this.taskQueue.add(
      async () => {
        try {
          const { grid, solution, ...metadata } = Serializer.parsePuzzle(
            await Compressor.decompress(decodeURIComponent(entry.data))
          );
          this.updateAndVerify(entry.data, 'local', metadata, solution ?? grid);
        } catch (_ex) {
          this.replace({
            data: entry.data,
            status: 'malformed',
          });
        }
      },
      { id: entry.data, priority: 20 }
    );
  };

  public enqueueSolve = (data: string) => {
    const entry = this.uploads.find(e => e.data === data);
    if (!entry) return;
    if (entry.status !== 'local') return;
    if (entry.solutionStatus !== 'manual' && entry.solutionStatus !== 'missing')
      return;
    if (!defaultSolver.isGridSupported(entry.gridWithSolution)) return;
    const controller = new AbortController();
    this.updateAndVerify(
      data,
      'solving',
      entry.metadata,
      entry.gridWithSolution,
      undefined,
      controller
    );
    void (async () => {
      try {
        await this.taskQueue.add(
          async ({ signal }) => {
            let updatedEntry = this.uploads.find(e => e.data === entry.data);
            if (!updatedEntry) return;
            if (updatedEntry.status !== 'solving') return;
            const solver = defaultSolver;
            if (!solver) return;
            try {
              let isAlternate = false;
              for await (const solution of solver.solve(
                updatedEntry.gridWithSolution,
                signal
              )) {
                if (!isAlternate) {
                  updatedEntry = this.uploads.find(e => e.data === data);
                  if (!updatedEntry) return;
                  if (updatedEntry.status !== 'solving') return;
                  if (solution) {
                    this.updateAndVerify(
                      data,
                      'solving',
                      updatedEntry.metadata,
                      solution,
                      'multiple',
                      controller
                    );
                  } else {
                    this.updateAndVerify(
                      data,
                      'local',
                      updatedEntry.metadata,
                      updatedEntry.gridWithSolution,
                      'none'
                    );
                  }
                  isAlternate = true;
                } else {
                  updatedEntry = this.uploads.find(e => e.data === data);
                  if (!updatedEntry) return;
                  if (updatedEntry.status !== 'solving') return;
                  if (solution) {
                    this.updateAndVerify(
                      data,
                      'local',
                      updatedEntry.metadata,
                      updatedEntry.gridWithSolution,
                      'multiple'
                    );
                  } else {
                    this.updateAndVerify(
                      data,
                      'local',
                      updatedEntry.metadata,
                      updatedEntry.gridWithSolution,
                      'unique'
                    );
                  }
                  break;
                }
              }
            } catch (ex) {
              console.error(ex);
            } finally {
              controller.abort();
              updatedEntry = this.uploads.find(e => e.data === data);
              if (updatedEntry?.status === 'solving') {
                this.updateAndVerify(
                  data,
                  'local',
                  updatedEntry.metadata,
                  updatedEntry.gridWithSolution,
                  'multiple'
                );
              }
            }
          },
          { id: entry.data, signal: controller.signal, priority: 10 }
        );
      } catch (_) {
        const updatedEntry = this.uploads.find(e => e.data === entry.data);
        if (updatedEntry?.status === 'solving') {
          this.updateAndVerify(
            data,
            'local',
            updatedEntry.metadata,
            updatedEntry.gridWithSolution
          );
        }
      }
    })();
    return controller;
  };

  public enqueueUpload = (data: string) => {
    const entry = this.uploads.find(e => e.data === data);
    if (!entry) return;
    if (entry.status !== 'local') return;
    if (!entry.checklistStatus) return;
    this.replace({
      ...entry,
      status: 'uploading',
    });
    void this.taskQueue.add(
      async () => {
        let entry = this.uploads.find(e => e.data === data);
        if (!entry) return;
        if (entry.status !== 'uploading') return;
        console.log('Uploading', entry);
        try {
          const puzzleData = await Compressor.compress(
            Serializer.stringifyGrid(entry.gridWithSolution)
          );
          const publishResult = await this.uploadQueue.add(
            async () => {
              const entry = this.uploads.find(e => e.data === data);
              if (!entry) return;
              if (entry.status !== 'uploading') return;
              const result = await api.createPuzzle(
                entry.metadata.title,
                entry.metadata.description,
                entry.metadata.difficulty,
                puzzleData
              );
              try {
                return await api.publishPuzzle(result.id);
              } catch (_) {
                await api.deletePuzzle(result.id);
              }
            },
            { id: data }
          );
          if (!publishResult) throw new Error('Upload canceled');
          entry = this.uploads.find(e => e.data === data);
          if (!entry) return;
          if (entry.status !== 'uploading') return;
          this.replace({
            puzzleId: publishResult.id,
            ...entry,
            status: 'online',
          });
        } catch (ex) {
          if (ex && typeof ex === 'object')
            toast.error('message' in ex ? String(ex.message) : 'Upload failed');
          entry = this.uploads.find(e => e.data === data);
          if (!entry) return;
          if (entry.status === 'uploading') {
            this.replace({
              ...entry,
              status: 'local',
            });
          }
        }
      },
      { id: data }
    );
  };

  public edit = (
    data: string,
    metadata: PuzzleMetadata,
    gridWithSolution: GridData
  ) => {
    const entry = this.uploads.find(e => e.data === data);
    if (!entry) return;
    this.updateAndVerify(data, 'local', metadata, gridWithSolution);
  };

  private updateAndVerify = (
    data: string,
    status: 'local' | 'solving',
    metadata: PuzzleMetadata,
    gridWithSolution: GridData,
    solutionStatus?: SolutionStatus,
    solverController?: AbortController
  ) => {
    const resetGrid = gridWithSolution.resetTiles();
    let grid: GridData;
    let solution: GridData | null;
    if (resetGrid.colorEquals(gridWithSolution)) {
      grid = gridWithSolution;
      solution = null;
      solutionStatus ??= 'missing';
    } else {
      grid = resetGrid;
      solution = gridWithSolution;
      solutionStatus ??= 'manual';
    }
    const state = validateGrid(grid, solution);
    const checklist = validatePuzzleChecklist(
      metadata,
      gridWithSolution,
      state
    );
    if (checklist.isValid) {
      this.replace({
        status,
        data,
        metadata,
        gridWithSolution,
        solutionStatus,
        checklistStatus: true,
        solverController,
      } as UploadEntry);
    } else {
      this.replace({
        status,
        data,
        metadata,
        gridWithSolution,
        solutionStatus,
        checklistStatus: false,
        error: getErrorMessage(
          checklist.items.find(item => !item.success && item.mandatory)?.id ??
            'unknown'
        ),
        solverController,
      } as UploadEntry);
    }
  };

  public extractFromText = (text: string) => {
    const links = text.matchAll(linkRegex);
    for (const match of links) {
      if (match[1]) {
        this.add(match[1]);
      }
    }
  };

  public add = (data: string) => {
    if (data.length === 0) return;
    if (this.uploads.find(e => e.data === data)) return;
    const entry: UploadEntry = {
      status: 'decoding',
      data,
    };
    this.uploads = [...this.uploads, entry];
    this.enqueueDecode(entry);
    this.notifyArrayChange();
  };

  public delete = (data: string) => {
    this.uploads = this.uploads.filter(e => e.data !== data);
    this.notifyArrayChange();
  };

  private replace = (entry: UploadEntry) => {
    const index = this.uploads.findIndex(e => e.data === entry.data);
    if (index !== -1) {
      this.uploads = [
        ...this.uploads.slice(0, index),
        entry,
        ...this.uploads.slice(index + 1),
      ];
      this.notifyEntryChange(entry.data);
    }
  };

  private notifyArrayChange = () => {
    for (const listener of this.arrayListeners) {
      listener();
    }
  };

  private notifyEntryChange = (data: string) => {
    const listeners = this.entryListeners[data];
    for (const listener of listeners ?? []) {
      listener();
    }
  };
}

function useUploadManager(managerRef: RefObject<UploadManager>) {
  return useSyncExternalStore(
    managerRef.current.subscribeToArray,
    managerRef.current.getUploads
  );
}

function useTaskQueue(managerRef: RefObject<UploadManager>) {
  return useSyncExternalStore(
    managerRef.current.subscribeToQueueIdle,
    managerRef.current.isQueueIdle
  );
}

function useUploadEntry(managerRef: RefObject<UploadManager>, data: string) {
  return useSyncExternalStore(
    managerRef.current.subscribeToEntry(data),
    managerRef.current.getEntry(data)
  );
}

const UploadEntryRow = memo(function UploadEntryRow({
  data,
  uploadManager,
}: {
  data: string;
  uploadManager: RefObject<UploadManager>;
}) {
  const { me } = useOnline();
  const entry = useUploadEntry(uploadManager, data);
  const puzzleEditorRef = useRef<PuzzleEditorRef>(null);
  const autoSolvable = useMemo(() => {
    if (
      entry &&
      entry.status === 'local' &&
      (entry.solutionStatus === 'manual' ||
        entry.solutionStatus === 'missing') &&
      'gridWithSolution' in entry
    ) {
      return defaultSolver.isGridSupported(entry.gridWithSolution);
    } else {
      return null;
    }
  }, [entry]);
  if (!entry) return null;
  const puzzleInfo =
    entry.status !== 'decoding' && entry.status !== 'malformed' ? (
      <div className="flex gap-2 items-center flex-wrap">
        {(entry.status === 'solving' || entry.status === 'uploading') && (
          <Loading className="w-6 h-6" />
        )}
        <div className="font-mono max-w-xs whitespace-nowrap overflow-hidden text-ellipsis">
          {entry.metadata.title}
        </div>
        <div className="badge badge-secondary badge-sm shrink-0">
          {entry.status === 'online' ? me?.name : entry.metadata.author}
        </div>
        <Difficulty value={entry.metadata.difficulty} size="xs" />
        <div
          className="tooltip tooltip-info tooltip-top"
          data-tip="Open in a new tab"
        >
          <button
            className="btn btn-sm btn-square btn-ghost"
            onClick={async () => {
              if (entry.status === 'online') {
                const url = new URL(window.location.origin);
                url.pathname = '/create/' + entry.puzzleId;
                window.open(url.toString(), '_blank');
              } else {
                const resetGrid = entry.gridWithSolution.resetTiles();
                let puzzle: Puzzle;
                if (resetGrid.colorEquals(entry.gridWithSolution)) {
                  puzzle = {
                    ...entry.metadata,
                    grid: entry.gridWithSolution,
                    solution: null,
                  };
                } else {
                  puzzle = {
                    ...entry.metadata,
                    grid: resetGrid,
                    solution: entry.gridWithSolution,
                  };
                }
                const data = await Compressor.compress(
                  Serializer.stringifyPuzzle(puzzle)
                );
                const url = new URL(window.location.origin);
                url.pathname = '/create';
                url.searchParams.set('loader', 'visible');
                url.searchParams.set('d', data);
                window.open(url.toString(), '_blank');
              }
            }}
          >
            <FaExternalLinkAlt />
          </button>
        </div>
        {entry.status !== 'online' && (
          <div
            className="tooltip tooltip-error tooltip-top"
            data-tip="Delete this puzzle"
          >
            <button
              className="btn btn-sm btn-ghost btn-square text-error"
              onClick={() => uploadManager.current.delete(entry.data)}
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    ) : (
      <div className="flex gap-2 items-center flex-wrap">
        {entry.status === 'decoding' && <Loading className="w-6 h-6" />}
        <div className="font-mono max-w-xs whitespace-nowrap overflow-hidden text-ellipsis">
          {entry.data}
        </div>
        {entry.status === 'malformed' && (
          <div
            className="tooltip tooltip-error tooltip-top"
            data-tip="Delete this puzzle"
          >
            <button
              className="btn btn-sm btn-ghost btn-square text-error"
              onClick={() => uploadManager.current.delete(entry.data)}
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    );
  const controls =
    entry.status === 'local' ? (
      <>
        {autoSolvable ? (
          <button
            className="btn btn-sm"
            onClick={() => {
              uploadManager.current.enqueueSolve(entry.data);
            }}
          >
            Auto-solve
          </button>
        ) : (
          <div className="btn btn-sm btn-disabled">
            {autoSolvable === false ? 'Not auto-solvable' : 'Solved'}
          </div>
        )}
        <button
          className="btn btn-sm"
          onClick={() => {
            puzzleEditorRef.current?.open(
              entry.metadata,
              entry.gridWithSolution
            );
          }}
        >
          Edit
        </button>
        <PuzzleEditorModal
          ref={puzzleEditorRef}
          onChange={(metadata, gridWithSolution) => {
            uploadManager.current.edit(entry.data, metadata, gridWithSolution);
          }}
        />
        <div
          className={cn(
            'badge shrink-0',
            (entry.solutionStatus === 'multiple' ||
              entry.solutionStatus === 'manual') &&
              'badge-info',
            entry.solutionStatus === 'unique' && 'badge-success',
            (entry.solutionStatus === 'none' ||
              entry.solutionStatus === 'missing') &&
              'badge-error'
          )}
        >
          {entry.solutionStatus === 'multiple' && 'Multiple solutions'}
          {entry.solutionStatus === 'missing' && 'Missing solution'}
          {entry.solutionStatus === 'manual' && 'Solution provided'}
          {entry.solutionStatus === 'unique' && 'Unique solution'}
          {entry.solutionStatus === 'none' && 'No solution'}
        </div>
      </>
    ) : entry.status === 'solving' ? (
      <>
        <button
          className="btn btn-sm"
          onClick={() => {
            entry.solverController.abort();
          }}
        >
          Cancel solve
        </button>
      </>
    ) : null;
  const statusBadge =
    entry.status === 'decoding' ? (
      <div className="badge shrink-0">Decoding...</div>
    ) : entry.status === 'local' && !entry.checklistStatus ? (
      <div className="badge badge-error shrink-0">Invalid</div>
    ) : entry.status === 'local' && entry.checklistStatus ? (
      <div className="badge badge-success shrink-0">Verified</div>
    ) : entry.status === 'solving' ? (
      <div className="badge badge-info shrink-0">Solving...</div>
    ) : entry.status === 'malformed' ? (
      <div className="badge badge-error shrink-0">Malformed data</div>
    ) : entry.status === 'uploading' ? (
      <div className="badge shrink-0">Uploading...</div>
    ) : entry.status === 'online' ? (
      <div className="badge badge-success shrink-0">Published</div>
    ) : null;
  const uploadControls =
    entry.status === 'local' && entry.checklistStatus ? (
      <div
        className="tooltip tooltip-left tooltip-info"
        data-tip="Publish this puzzle"
      >
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            uploadManager.current.enqueueUpload(entry.data);
          }}
        >
          <FaUpload />
        </button>
      </div>
    ) : entry.status !== 'online' ? (
      <div
        className="tooltip tooltip-left tooltip-error"
        data-tip="Pass checklist before uploading"
      >
        <div className="btn btn-sm btn-disabled">
          <FaUpload />
        </div>
      </div>
    ) : null;

  return (
    <div key={entry.data} className="flex flex-col gap-1">
      <div className="flex gap-2 items-center justify-between min-h-8 flex-wrap">
        {puzzleInfo}
        <div className="flex gap-2 items-center flex-wrap">
          {'error' in entry && <div>{entry.error}</div>}
          {controls}
          {statusBadge}
          {uploadControls}
        </div>
      </div>
      <div className="divider m-0" />
    </div>
  );
});

const MasterControls = memo(function MasterControls({
  uploadManager,
}: {
  uploadManager: RefObject<UploadManager>;
}) {
  const entries = useUploadManager(uploadManager);
  const isQueueIdle = useTaskQueue(uploadManager);
  const solvableCount = useMemo(
    () =>
      entries.reduce(
        (acc, entry) =>
          entry.status === 'local' &&
          (entry.solutionStatus === 'manual' ||
            entry.solutionStatus === 'missing') &&
          defaultSolver.isGridSupported(entry.gridWithSolution)
            ? acc + 1
            : acc,
        0
      ),
    [entries]
  );
  const uploadableCount = useMemo(
    () =>
      entries.reduce(
        (acc, entry) =>
          entry.status === 'local' && entry.checklistStatus ? acc + 1 : acc,
        0
      ),
    [entries]
  );
  return (
    <div className="flex gap-2 items-center justify-between flex-wrap">
      <div>{entries.length} uploads</div>
      <div className="flex gap-2 items-center flex-wrap">
        {!isQueueIdle && <div>Working...</div>}
        <button
          className={cn(
            'btn btn-sm',
            (!isQueueIdle || solvableCount === 0) && 'btn-disabled'
          )}
          onClick={() => {
            uploadManager.current.getUploads().forEach(entry => {
              uploadManager.current.enqueueSolve(entry.data);
            });
          }}
        >
          Auto-solve all ({solvableCount})
        </button>
        <button
          className={cn(
            'btn btn-sm',
            (!isQueueIdle || uploadableCount === 0) && 'btn-disabled'
          )}
          onClick={() => {
            uploadManager.current.getUploads().forEach(entry => {
              uploadManager.current.enqueueUpload(entry.data);
            });
          }}
        >
          Publish all ({uploadableCount})
        </button>
      </div>
    </div>
  );
});

export const Route = createLazyFileRoute('/_layout/uploader')({
  component: memo(function Uploader() {
    useRouteProtection('login');
    const uploadManager = useRef<UploadManager>(null!);
    uploadManager.current ??= new UploadManager();

    const entries = useUploadManager(uploadManager);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useBlocker({
      shouldBlockFn: () => !window.confirm('Are you sure you want to leave?'),
      disabled: entries.length === 0,
    });

    return (
      <ResponsiveLayout>
        <div className="text-3xl mt-4">
          <FaUpload className="inline-block me-4" aria-hidden="true" />
          Puzzle uploader
        </div>
        <div>
          Paste puzzles links into the box below. You can paste multiple links
          and their data will be automatically extracted.
        </div>
        <div>
          You can edit the extracted puzzle data before uploading or use the
          auto solver to generate missing solutions.
        </div>
        <div>
          During large-volume uploads, the uploader may pause to respect server
          rate limits. Please be patient and allow the uploader to complete the
          process.
        </div>
        <MasterControls uploadManager={uploadManager} />
        <div className="divider m-0" />
        {entries.map(entry => (
          <UploadEntryRow
            key={entry.data}
            data={entry.data}
            uploadManager={uploadManager}
          />
        ))}
        <textarea
          ref={textareaRef}
          placeholder="Paste puzzle links here"
          className="textarea w-full bg-base-100 text-base-content whitespace-pre font-mono h-48"
        ></textarea>
        <button
          className="btn btn-primary"
          onClick={() => {
            uploadManager.current.extractFromText(
              textareaRef.current?.value ?? ''
            );
            textareaRef.current!.value = '';
          }}
        >
          Load links
        </button>
      </ResponsiveLayout>
    );
  }),
});

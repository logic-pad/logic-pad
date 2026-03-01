import React, {
  Suspense,
  lazy,
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useEmbed } from '../contexts/EmbedContext.tsx';
import { useGrid } from '../contexts/GridContext.tsx';
import Accordion from '../components/Accordion';
import { useGridState } from '../contexts/GridStateContext.tsx';
import {
  PuzzleChecklist,
  PuzzleChecklistItem,
  validatePuzzleChecklist,
} from '@logic-pad/core/data/puzzle';
import GridData from '@logic-pad/core/data/grid';
import { useSolver } from '../contexts/SolverContext.tsx';
import Loading from '../components/Loading';
import { FaCheckCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import { puzzleEditQueryOptions } from '../routes/_layout.create.$puzzleId.tsx';
import { useQuery } from '@tanstack/react-query';
import { useOnlinePuzzle } from '../contexts/OnlinePuzzleContext.tsx';
import { ResourceStatus } from '../online/data.ts';

const SolverSelector = lazy(() => import('./SolverSelector'));

function ChecklistItem({
  type,
  children,
  tooltip,
}: {
  type: 'success' | 'error' | 'info' | 'none';
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 tooltip tooltip-top tooltip-info"
      data-tip={tooltip}
    >
      {type === 'success' ? (
        <FaCheckCircle size={22} className="text-success" />
      ) : type === 'error' ? (
        <FaTimesCircle size={22} className="text-error" />
      ) : type === 'info' ? (
        <FaInfoCircle size={22} className="text-info" />
      ) : (
        <FaInfoCircle size={22} className="opacity-0" />
      )}
      {children}
    </div>
  );
}

function ChecklistHelp({
  checklist,
  checklistComplete,
}: {
  checklist: PuzzleChecklist;
  checklistComplete: boolean;
}) {
  const dialogId = useId();
  const helpMessage = useMemo(() => {
    if (checklist.isValid && !checklistComplete) {
      return (
        <>
          <p>The solver has proved that your puzzle has no valid solution.</p>
          <p>
            If there are additional rules in your puzzle that make it solvable,
            please add it as a custome rule / custom symbol.
          </p>
          <p>
            Logic Pad will always consider your solution as valid if custom
            rules / symbols are involved.
          </p>
        </>
      );
    }
    const invalidItems = checklist.items
      .filter(i => !i.success && i.mandatory)
      .map(i => i.id);
    if (invalidItems.includes('metadataValid')) {
      return (
        <>
          <p>
            Every puzzle needs a title, an author name and a difficulty rating.
          </p>
          <p>Fill in those required fields in the Info tab.</p>
        </>
      );
    } else if (invalidItems.includes('gridValid')) {
      return (
        <>
          <p>Your grid either has zero width or zero height.</p>
          <p>Switch to the Tools tab to change the dimensions of your grid.</p>
        </>
      );
    } else if (invalidItems.includes('solutionIsComplete')) {
      return (
        <>
          <p>
            Your grid does not include rules that allow gray tiles in the final
            solution, so your solution must not include gray tiles.
          </p>
          <p>
            Provide a solution by filling in the grid without marking the tiles
            as clues.
          </p>
          <p>
            If you puzzle has more than one intended solution, use the Mystery:
            Alternate solution rule to provide alternate solutions.
          </p>
          <p>
            If your intended solution includes gray tiles, add a custom rule /
            symbol for indication. Logic Pad will then consider your solution as
            valid.
          </p>
        </>
      );
    } else if (invalidItems.includes('solutionIsValid')) {
      return (
        <>
          <p>Your solution does not satisfy one of the rules / symbols.</p>
          <p>Provide a valid solution to prove that your puzzle is solvable.</p>
          <p>
            If your intended solution does not satisfy all rules / symbols, add
            a custom rule / symbol for indication. Logic Pad will then consider
            your solution as valid.
          </p>
        </>
      );
    } else if (invalidItems.includes('solutionIsNotEmpty')) {
      return (
        <>
          <p>You have not provided a solution to your puzzle yet.</p>
          <p>
            Provide a solution by filling in the grid without marking the tiles
            as clues.
          </p>
          <p>
            Your grid contains rules / symbols that allow gray tiles, so your
            solution does not need to completely fill the grid.
          </p>
        </>
      );
    } else {
      return (
        <>
          <p>Generic checklist failure.</p>
          <p>
            Please report this to the developer with a link to the puzzle
            included.
          </p>
        </>
      );
    }
  }, [checklist, checklistComplete]);
  if (checklistComplete) return null;
  return (
    <>
      <button
        className="btn btn-outline"
        onClick={() => {
          const dialog = document.getElementById(
            `checklistHelp-${dialogId}`
          ) as HTMLDialogElement;
          dialog.showModal();
        }}
      >
        Why is my checklist incomplete?
      </button>
      <dialog id={`checklistHelp-${dialogId}`} className="modal">
        <div className="modal-box flex flex-col gap-4 text-base">
          <h3 className="font-semibold text-xl text-accent">
            Your checklist status
          </h3>
          {helpMessage}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}

const checklistItemMap = {
  metadataValid: (item: PuzzleChecklistItem) => (
    <ChecklistItem
      key="metadataValid"
      type={item.success ? 'success' : 'error'}
      tooltip={
        item.success
          ? 'All required metadata fields are filled'
          : 'Fill all required fields in the info tab'
      }
    >
      {item.success ? 'Metadata valid' : 'Metadata invalid'}
    </ChecklistItem>
  ),
  gridValid: (item: PuzzleChecklistItem) => (
    <ChecklistItem
      key="gridValid"
      type={item.success ? 'success' : 'error'}
      tooltip={
        item.success
          ? 'Grid dimensions are valid'
          : 'Grid width/height must be greater than zero'
      }
    >
      {item.success ? 'Grid valid' : 'Grid invalid'}
    </ChecklistItem>
  ),
  autoValidation: (item: PuzzleChecklistItem) => (
    <ChecklistItem
      key="autoValidation"
      type={item.success ? 'success' : 'info'}
      tooltip={
        item.success
          ? 'You puzzle solution is automatically validated'
          : 'Only the solution you provide will be accepted'
      }
    >
      {item.success ? 'Auto validation' : 'Solution required'}
    </ChecklistItem>
  ),
  solutionIsValid: (item: PuzzleChecklistItem) => (
    <ChecklistItem
      key="solutionIsValid"
      type={item.success ? 'success' : 'error'}
      tooltip="A valid solution is required to prove that the puzzle is solvable"
    >
      {item.success ? 'Solution valid' : 'Solution invalid'}
    </ChecklistItem>
  ),
  solutionIsComplete: (item: PuzzleChecklistItem) => (
    <ChecklistItem
      key="solutionIsComplete"
      type={item.success ? 'success' : 'error'}
      tooltip="A complete solution is required to prove that the puzzle is solvable"
    >
      {item.success ? 'Solution complete' : 'Solution incomplete'}
    </ChecklistItem>
  ),
  solutionIsNotEmpty: (item: PuzzleChecklistItem) => (
    <ChecklistItem
      key="solutionIsNotEmpty"
      type={item.success ? 'success' : 'error'}
      tooltip="Solution cannot be empty"
    >
      {item.success ? 'Solution not empty' : 'Solution empty'}
    </ChecklistItem>
  ),
};

interface TiedToGrid<T> {
  grid: GridData;
  value: T;
}

export interface PuzzleChecklistProps {
  onTabSwitch?: () => void;
}

export default memo(function PuzzleChecklist({
  onTabSwitch,
}: PuzzleChecklistProps) {
  const { features } = useEmbed();
  const { grid, metadata, setGrid } = useGrid();
  const { state } = useGridState();
  const { solver } = useSolver();

  const { id } = useOnlinePuzzle();
  const { data, isLoading } = useQuery(puzzleEditQueryOptions(id));

  const solverRequest = useRef(0);
  const [solveRef, setSolveRef] = useState<AbortController | null>(null);
  const [solution, setSolution] = useState<TiedToGrid<
    GridData | 'empty' | null
  > | null>(null);
  const [alternate, setAlternate] = useState<TiedToGrid<
    GridData | 'empty' | null
  > | null>(null);

  useEffect(() => {
    if (solution && !solution.grid.resetTiles().equals(grid.resetTiles())) {
      setSolution(null);
      if (solveRef !== null) {
        solveRef.abort();
        setSolveRef(null);
      }
    }
    if (alternate && !alternate.grid.resetTiles().equals(grid.resetTiles())) {
      setAlternate(null);
      if (solveRef !== null) {
        solveRef.abort();
        setSolveRef(null);
      }
    }
  }, [grid, solution, alternate, solveRef]);

  const checklist = useMemo(
    () => validatePuzzleChecklist(metadata, grid, state),
    [metadata, grid, state]
  );

  const autoSolvable = useMemo(
    () => solver?.isGridSupported(grid) ?? false,
    [solver, grid]
  );

  const checklistComplete =
    checklist.isValid &&
    (solution === null ||
      (solution.value !== null && solution.value !== 'empty'));

  if (!features.checklist) return null;

  return (
    <Accordion
      title={
        <>
          <span>Checklist</span>
          {checklistComplete ? (
            <div className="badge badge-success ml-2">Complete</div>
          ) : (
            <div className="badge badge-error ml-2">Incomplete</div>
          )}
        </>
      }
      className="tour-puzzle-checklist"
    >
      <div className="flex flex-col gap-2 text-sm">
        {checklist.items.map(item =>
          checklistItemMap[item.id as keyof typeof checklistItemMap]?.(item)
        )}
        {solution !== null && (
          <>
            <ChecklistItem
              key="solution"
              type={
                solution.value !== null && solution.value !== 'empty'
                  ? 'success'
                  : 'error'
              }
              tooltip={
                solution.value === 'empty'
                  ? 'None of the tiles can be filled'
                  : solution.value !== null
                    ? 'Solution found. Click to view'
                    : 'This puzzle has no solution'
              }
            >
              <span className="flex-1 text-start">
                {solution.value === 'empty'
                  ? 'No deducible tiles'
                  : solution.value !== null
                    ? 'Solution found'
                    : 'No solution'}
              </span>
              {!!solution?.value && solution.value !== 'empty' && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setGrid(solution.value as GridData);
                    setSolution({
                      grid: solution.value as GridData,
                      value: solution.value,
                    });
                    if (alternate && alternate.value !== 'empty') {
                      setAlternate({
                        grid: solution.value as GridData,
                        value: alternate.value,
                      });
                    }
                  }}
                >
                  View
                </button>
              )}
            </ChecklistItem>
            {(alternate !== null || !solveRef) && (
              <ChecklistItem
                key="alternate"
                type={
                  alternate !== null
                    ? alternate.value !== null
                      ? 'info'
                      : 'success'
                    : 'none'
                }
                tooltip={
                  alternate !== null
                    ? alternate.value === 'empty'
                      ? 'None of the tiles can be filled'
                      : alternate.value !== null
                        ? 'Click to view alternate solution'
                        : 'The solution is unique'
                    : 'Alternate solution not reported by solver'
                }
              >
                <span className="flex-1 text-start">
                  {alternate !== null
                    ? alternate.value === 'empty'
                      ? 'No deducible tiles'
                      : alternate.value !== null
                        ? 'Solution not unique'
                        : 'Unique solution'
                    : 'Alternate unavailable'}
                </span>
                {!!alternate?.value && alternate.value !== 'empty' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setGrid(alternate.value as GridData);
                      if (solution)
                        setSolution({
                          grid: alternate.value as GridData,
                          value: solution.value,
                        });
                      setAlternate({
                        grid: alternate.value as GridData,
                        value: alternate.value,
                      });
                    }}
                  >
                    View
                  </button>
                )}
              </ChecklistItem>
            )}
            {!solveRef && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setSolution(null);
                  setAlternate(null);
                }}
              >
                Reset solver
              </button>
            )}
          </>
        )}
        {solveRef && (
          <ChecklistItem
            key="solving"
            type="info"
            tooltip={
              solution === null
                ? 'Solving...'
                : 'Looking for alternate solutions...'
            }
          >
            <span className="flex-1 text-start">
              {solution === null ? 'Solving...' : 'Verifying...'}
            </span>
            {solver?.supportsCancellation && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  solveRef.abort();
                  setSolveRef(null);
                }}
              >
                Cancel
              </button>
            )}
          </ChecklistItem>
        )}
        {!solveRef && solution === null && (
          <>
            <ChecklistItem
              key="autoSolvable"
              type={autoSolvable ? 'success' : 'info'}
              tooltip={
                autoSolvable
                  ? 'Can be solved automatically by the solver'
                  : 'Cannot be solved automatically'
              }
            >
              {autoSolvable ? 'Auto solvable' : 'Not auto solvable'}
            </ChecklistItem>
            <Suspense fallback={<Loading />}>
              <SolverSelector
                onSolve={async solver => {
                  const requestId = ++solverRequest.current;
                  const abortController = new AbortController();
                  setSolveRef(abortController);
                  setSolution(null);
                  setAlternate(null);
                  try {
                    let isAlternate = false;
                    for await (const solution of solver.solve(
                      grid,
                      abortController.signal
                    )) {
                      if (!isAlternate) {
                        if (requestId !== solverRequest.current) break;
                        setSolution({
                          grid,
                          value: solution?.resetTiles().colorEquals(solution)
                            ? 'empty'
                            : solution,
                        });
                        isAlternate = true;
                      } else {
                        if (requestId !== solverRequest.current) break;
                        setAlternate({
                          grid,
                          value: solution?.resetTiles().colorEquals(solution)
                            ? 'empty'
                            : solution,
                        });
                        break;
                      }
                    }
                  } catch (ex) {
                    console.error(ex);
                  } finally {
                    abortController.abort();
                    setSolveRef(null);
                  }
                }}
              />
            </Suspense>
          </>
        )}
        <ChecklistHelp
          checklist={checklist}
          checklistComplete={checklistComplete}
        />
        {checklistComplete && !isLoading && !!id && !!data && (
          <button className="btn btn-primary" onClick={onTabSwitch}>
            {data?.status === ResourceStatus.Private
              ? 'Publish puzzle'
              : 'Puzzle statistics'}
          </button>
        )}
      </div>
    </Accordion>
  );
});

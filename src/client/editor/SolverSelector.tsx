import { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { getGridAtom } from '../state/grid.ts';
import { cn } from '../../client/uiHelper.ts';
import { solverAtom } from '../state/solver.ts';
import { GoInfo } from 'react-icons/go';
import Solver from '@logic-pad/core/data/solver/solver';
import { allSolvers } from '@logic-pad/core/data/solver/allSolvers';

export interface SolverSelectorProps {
  onSolve?: (solver: Solver) => void;
}

// million-ignore
export default memo(function SolverSelector({ onSolve }: SolverSelectorProps) {
  const grid = useAtomValue(getGridAtom);
  const [solver, setSolver] = useAtom(solverAtom);

  const [environmentCheck, setEnvironmentCheck] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    setEnvironmentCheck(undefined);
  }, [solver]);

  useEffect(() => {
    if (solver === null) {
      setSolver([...allSolvers.values()][0]);
    }
  }, [solver, setSolver]);

  const autoSolvable = useMemo(
    () => solver?.isGridSupported(grid) ?? false,
    [solver, grid]
  );

  if (solver === null) return null;

  return (
    <div
      className="tooltip tooltip-top tooltip-info"
      data-tip={
        environmentCheck === false
          ? 'Your browser does not support the solver'
          : 'This may take a while. Editing the puzzle will cancel the operation'
      }
    >
      <div className="flex gap-1 items-center">
        <button
          type="button"
          aria-label="Solver info"
          className="btn btn-ghost p-1 min-h-0 h-fit shrink-0 flex gap-1 items-center"
          onClick={() =>
            (
              document.getElementById('solverModel') as HTMLDialogElement
            ).showModal()
          }
        >
          Solver:
          <GoInfo size={18} />
        </button>
        <dialog id="solverModel" className="modal">
          <div className="modal-box text-base-content">
            <h3 className="font-bold text-xl">Available solvers</h3>
            {[...allSolvers.values()].map(solver => (
              <Fragment key={solver.id}>
                <p className="py-2 text-left">
                  <b className="text-xl">{solver.id}</b>
                  <span className="text-sm ms-4"> by {solver.author}</span>
                  <br />
                </p>
                <p className="pb-2 text-left">{solver.description}</p>
              </Fragment>
            ))}
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button aria-label="Close dialog">close</button>
          </form>
        </dialog>
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={solver.id}
          onChange={e => setSolver(allSolvers.get(e.target.value)!)}
        >
          {[...allSolvers.keys()].map(id => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={cn(
            'btn btn-outline btn-primary btn-sm',
            environmentCheck === false && 'btn-error'
          )}
          onClick={async () => {
            let support = environmentCheck;
            if (support === undefined) {
              support = await solver.environmentCheck.value;
              setEnvironmentCheck(support);
            }
            if (!support) return;
            onSolve?.(solver);
          }}
          disabled={environmentCheck === false || !autoSolvable}
        >
          Solve
        </button>
      </div>
    </div>
  );
});

import { memo } from 'react';
import { useGrid } from '../contexts/GridContext';
import InsightSolver from '@logic-pad/core/data/solver/insight/insightSolver';
import { IoIosEye } from 'react-icons/io';

const solver = new InsightSolver();

/**
 * A debug component to invoke the insight solver
 */
export default memo(function InsightSolver() {
  const { grid, setGrid } = useGrid();
  return (
    <div className="grow-0 shrink-0 bg-primary/10 flex flex-col items-stretch">
      <button
        type="button"
        className="btn btn-ghost text-lg"
        onClick={async () => {
          console.log('Starting insight solver...');
          for await (const solution of solver.solve(grid)) {
            if (solution) {
              setGrid(solution);
              console.log('Solution found');
              return;
            } else {
              console.error('No insights found');
              return;
            }
          }
          console.error('No response from solver');
        }}
      >
        <IoIosEye />
        Insight
      </button>
    </div>
  );
});

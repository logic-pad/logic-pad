import { memo, useEffect, useMemo, useState } from 'react';
import { PartPlacement, PartSpec } from './types';
import PerfectionRule, {
  instance as perfectionInstance,
} from '@logic-pad/core/data/rules/perfectionRule';
import { useGridState } from '../../contexts/GridStateContext';
import { Color, State, Position } from '@logic-pad/core/data/primitives';
import { useEdit } from '../../contexts/EditContext';
import { useGrid } from '../../contexts/GridContext';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSolvePath } from '../../contexts/SolvePathContext';
import { useDelta } from 'react-delta-hooks';
import { RiErrorWarningFill } from 'react-icons/ri';
import { useEmbed } from '../../contexts/EmbedContext';
import { safeClipboard } from '../../uiHelper';

export interface PerfectionControlsPartProps {
  instruction: PerfectionRule;
}

export default memo(function PerfectionControlsPart({
  instruction,
}: PerfectionControlsPartProps) {
  const { grid, setGridRaw } = useGrid();
  const { embedChildren } = useEmbed();
  const { state } = useGridState();
  const { undo } = useEdit();
  const { solvePath, setSolvePath, visualizeSolvePath, setVisualizeSolvePath } =
    useSolvePath();
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (tooltip) {
      const timeout = window.setTimeout(() => setTooltip(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [tooltip]);

  const handleUndo = () => {
    if (state.final !== State.Error) return;
    const result = undo(grid);
    if (result) setGridRaw(result);
  };

  useHotkeys('z', handleUndo, {
    enabled: () =>
      !instruction.editor &&
      state.final === State.Error &&
      embedChildren.length === 0,
    preventDefault: true,
    useKey: true,
  });

  const gridDelta = useDelta(grid);
  useEffect(() => {
    if (instruction.editor) return;
    if (!gridDelta) return;
    if (!gridDelta.prev) return;
    if (gridDelta.prev === gridDelta.curr) return;
    const positionsRemoved: Position[] = [];
    const positionsAdded: Position[] = [];
    let newSolvePath = solvePath.slice();
    grid.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const oldTile = gridDelta.prev!.tiles[y][x];
        if (tile === oldTile || tile.exists !== oldTile.exists) return;
        if (oldTile.color !== Color.Gray && tile.color !== oldTile.color)
          positionsRemoved.push({ x, y });
        if (tile.color !== Color.Gray && tile.color !== oldTile.color)
          positionsAdded.push({ x, y });
      });
    });
    if (positionsRemoved.length > 0) {
      const endOfPath = newSolvePath.slice(-positionsRemoved.length);
      if (
        endOfPath.every(pos =>
          positionsRemoved.some(p => p.x === pos.x && p.y === pos.y)
        )
      ) {
        newSolvePath.splice(-positionsRemoved.length);
      } else {
        newSolvePath = [];
      }
    }
    if (positionsAdded.length > 0) {
      if (
        newSolvePath.some(pos =>
          positionsAdded.some(p => p.x === pos.x && p.y === pos.y)
        )
      ) {
        newSolvePath = [];
      }
      newSolvePath.push(...positionsAdded);
    }
    setSolvePath(newSolvePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridDelta, solvePath, setSolvePath]);

  const progress = useMemo(() => {
    const empty = grid.getTileCount(true, false, Color.Gray);
    const filled = solvePath.length;
    return (filled / (empty + filled)) * 100;
  }, [grid, solvePath]);

  if (instruction.editor) return null;

  return (
    <>
      {state.final === State.Error && (
        <div className="card grow-0 shrink-0 card-side rounded-none bg-primary/10">
          <figure className="shrink-0 pl-2 self-center">
            <RiErrorWarningFill size={48} />
          </figure>
          <div className="card-body p-4">
            <p>Your progress is incorrect</p>
            <button className="btn btn-primary" onClick={handleUndo}>
              Undo (Z)
            </button>
          </div>
        </div>
      )}
      <div className="grow-0 shrink-0 bg-primary/10 flex flex-col items-stretch gap-1">
        <div className="flex flex-col gap-4 justify-around mx-4 my-2 items-stretch">
          <fieldset className="fieldset flex flex-col items-center">
            <label className="label w-full justify-between cursor-pointer">
              <span className="text-neutral-content text-base">
                Visualize solve path
              </span>
              <input
                type="checkbox"
                className="toggle"
                checked={visualizeSolvePath}
                onChange={e => setVisualizeSolvePath(e.currentTarget.checked)}
              />
            </label>
            <div
              className="tooltip"
              data-tip={tooltip ?? 'Copy solve path as text'}
            >
              <button
                className="btn btn-sm btn-neutral"
                onClick={async () => {
                  const output = solvePath
                    .map(({ x, y }) => `${x}:${y}`)
                    .join(', ');
                  await safeClipboard.writeText(output);
                  setTooltip('Copied!');
                }}
              >
                Copy solve path
              </button>
            </div>
          </fieldset>
        </div>
        <progress
          className="progress progress-primary"
          value={progress}
          max="100"
        ></progress>
      </div>
    </>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.LeftBottom,
  instructionId: perfectionInstance.id,
};

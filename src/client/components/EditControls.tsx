import { memo, useState, useSyncExternalStore } from 'react';
import {
  FiCheck,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiRefreshCcw,
} from 'react-icons/fi';
import { useGrid } from '../contexts/GridContext.tsx';
import { cn } from '../../client/uiHelper.ts';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEdit } from '../contexts/EditContext.tsx';
import { useEmbed } from '../contexts/EmbedContext.tsx';
import { useSearch } from '@tanstack/react-router';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import GridData from '@logic-pad/core/data/grid';
import { IoMdColorFill } from 'react-icons/io';
import mouseContext from '../grid/MouseContext.tsx';
import { useGridState } from '../contexts/GridStateContext.tsx';
import Loading from './Loading.tsx';

export interface EditControlsProps {
  onReset?: () => void;
}

const ValidatorStatus = memo(function ValidatorStatus() {
  const { gridValidator } = useGridState();
  const isLoading = useSyncExternalStore(
    gridValidator.subscribeToLoad,
    gridValidator.isLoading
  );
  return (
    <div
      className="tooltip tooltip-info tooltip-top h-12 w-12 px-2 flex items-center justify-center"
      data-tip={isLoading ? 'Validating...' : 'Validated'}
    >
      {isLoading ? (
        <Loading className="px-1 rounded-box" aria-hidden="true" />
      ) : (
        <FiCheck size={20} className="rounded-box" aria-hidden="true" />
      )}
    </div>
  );
});

const EditControls = memo(function EditControls({
  onReset,
}: EditControlsProps) {
  const { grid, setGridRaw } = useGrid();
  const { undoStack, redoStack, undo: undoEdit, redo: redoEdit } = useEdit();
  const { embedChildren } = useEmbed();

  const undo = () => {
    const result = undoEdit(grid);
    if (result) setGridRaw(result);
  };

  const redo = () => {
    const result = redoEdit(grid);
    if (result) setGridRaw(result);
  };

  const restart = () => {
    onReset?.();
  };

  useHotkeys('z', undo, {
    preventDefault: true,
    enabled: embedChildren.length === 0,
    useKey: true,
  });
  useHotkeys('r', restart, {
    preventDefault: true,
    enabled: embedChildren.length === 0,
    useKey: true,
  });
  useHotkeys('y', redo, {
    preventDefault: true,
    enabled: embedChildren.length === 0,
    useKey: true,
  });

  const [modifierInverted, setModifierInverted] = useState(
    mouseContext.modifierInverted
  );
  const onSwitch = () => {
    setModifierInverted(i => {
      const newValue = !i;
      mouseContext.setModifierInverted(newValue);
      return newValue;
    });
  };

  return (
    <div className="flex flex-wrap shrink-0 items-center bg-base-100 shadow-md text-base-content rounded-box fixed bottom-2 z-40 left-2 right-28 xl:static xl:shadow-md">
      <ValidatorStatus />
      <ul className="menu menu-horizontal shrink-0 justify-center flex-1 gap-2">
        <li className={cn(undoStack.length === 0 && 'disabled')}>
          <a
            className="tooltip tooltip-info"
            role="button"
            data-tip="Undo (Z)"
            onClick={undo}
          >
            <FiCornerUpLeft />
          </a>
        </li>
        <li>
          <a
            className="tooltip tooltip-info"
            role="button"
            data-tip="Restart (R)"
            onClick={restart}
          >
            <FiRefreshCcw />
          </a>
        </li>
        <li className={cn(redoStack.length === 0 && 'disabled')}>
          <a
            className="tooltip tooltip-info"
            role="button"
            data-tip="Redo (Y)"
            onClick={redo}
          >
            <FiCornerUpRight />
          </a>
        </li>
      </ul>
      <div
        className="tooltip tooltip-info tooltip-top h-12"
        data-tip="Enable flood fill"
      >
        <button
          className={cn(
            'btn h-12 aspect-square px-2 rounded-box',
            modifierInverted ? 'btn-accent' : 'btn-ghost'
          )}
          onClick={onSwitch}
        >
          <IoMdColorFill size={20} />
        </button>
      </div>
    </div>
  );
});

export default EditControls;

export function SolveEditControls() {
  const { grid, setGrid } = useGrid();
  const search = useSearch({ from: undefined, strict: false });
  return (
    <EditControls
      onReset={async () => {
        let newGrid: GridData;
        if ('d' in search && search.d) {
          newGrid = grid.withTiles(
            Serializer.parsePuzzle(await Compressor.decompress(search.d)).grid
              .tiles
          );
        } else {
          newGrid = grid.resetTiles();
        }
        if (newGrid.equals(grid)) return;
        setGrid(newGrid);
      }}
    />
  );
}

export function EditorEditControls() {
  const { grid, setGrid } = useGrid();
  return (
    <EditControls
      onReset={() => {
        const newGrid = grid.resetTiles();
        if (newGrid.equals(grid)) return;
        setGrid(newGrid);
      }}
    />
  );
}

export interface PerfectionEditControlsProps {
  onReset?: () => void;
}

export function PerfectionEditControls({
  onReset,
}: PerfectionEditControlsProps) {
  const { grid, setGridRaw } = useGrid();
  const { clearHistory } = useEdit();
  const search = useSearch({ from: undefined, strict: false });

  if (onReset) return <EditControls onReset={onReset} />;

  return (
    <EditControls
      onReset={async () => {
        let newGrid: GridData;
        if ('d' in search && search.d) {
          newGrid = grid.withTiles(
            Serializer.parsePuzzle(await Compressor.decompress(search.d)).grid
              .tiles
          );
        } else {
          newGrid = grid.resetTiles();
        }
        if (newGrid.equals(grid)) return;
        setGridRaw(newGrid);
        clearHistory(newGrid);
      }}
    />
  );
}

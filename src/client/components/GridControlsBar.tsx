import { memo, useState, useSyncExternalStore } from 'react';
import {
  FiCheck,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiRefreshCcw,
} from 'react-icons/fi';
import { useAtomValue, useSetAtom } from 'jotai';
import { getGridAtom, setGridAtom, setGridRawAtom } from '../state/grid.ts';
import { cn } from '../uiHelper.ts';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  redoAtom,
  redoStackAtom,
  undoAtom,
  undoStackAtom,
  clearHistoryAtom,
} from '../state/editHistory.ts';
import { embedChildrenAtom } from '../state/embed.ts';
import { useSearch } from '@tanstack/react-router';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import GridData from '@logic-pad/core/data/grid';
import { IoMdColorFill } from 'react-icons/io';
import mouseContext from '../grid/MouseContext.tsx';
import { gridValidatorAtom } from '../state/gridState.ts';
import Loading from './Loading.tsx';
import { tip } from './Tooltip.tsx';
import { scaleAtom } from '../state/display.ts';
import { getSetting } from '../state/settings.ts';

export interface GridControlsBarProps {
  onReset?: () => void;
}

const noopSubscribe = () => () => {};

const ValidatorStatus = memo(function ValidatorStatus() {
  const gridValidator = useAtomValue(gridValidatorAtom);
  const isLoading = useSyncExternalStore(
    gridValidator?.subscribeToLoad ?? noopSubscribe,
    () => gridValidator?.isLoading() ?? false
  );
  return (
    <div
      className="h-10 w-12 px-2 flex items-center justify-center"
      {...tip(isLoading ? 'Validating...' : 'Validated')}
    >
      {isLoading ? (
        <Loading className="px-1 rounded-box" aria-hidden="true" />
      ) : (
        <FiCheck size={20} className="rounded-box" aria-hidden="true" />
      )}
    </div>
  );
});

const FloodFillToggle = memo(function FloodFillToggle() {
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
    <div className="h-10" {...tip('Enable flood fill')}>
      <button
        className={cn(
          'btn h-10 aspect-square px-2 rounded-box',
          modifierInverted ? 'btn-accent' : 'btn-ghost'
        )}
        onClick={onSwitch}
      >
        <IoMdColorFill size={20} />
      </button>
    </div>
  );
});

const ScaleSlider = memo(function ScaleSlider() {
  const scale = useAtomValue(scaleAtom);
  const setScale = useSetAtom(scaleAtom);
  return (
    <div className="flex flex-1 items-center" {...tip('Resize grid')}>
      <input
        type="range"
        min={-2}
        max={2}
        step={0.2}
        value={Math.log2(scale)}
        onChange={e => setScale(2 ** Number(e.currentTarget.value))}
        className="range w-full m-2"
        aria-label="Resize grid"
      />
    </div>
  );
});

export interface ColorSwapProps {
  inverted: boolean;
  large?: boolean;
  onSwitch: () => void;
}

const ColorSwap = memo(function ColorSwap({
  inverted,
  large,
  onSwitch,
}: ColorSwapProps) {
  return (
    <div
      className="flex items-stretch"
      {...tip('Toggle primary color', large ? 'left' : 'top')}
    >
      <label
        className={cn(
          'swap swap-flip',
          large ? 'text-2xl shadow-xl' : 'text-lg shadow-xs h-10'
        )}
      >
        <input type="checkbox" checked={inverted} onChange={onSwitch} />
        <div
          className={cn(
            'swap-on bg-white text-black text-center flex justify-center items-center rounded-box',
            large ? 'w-24 h-24 p-2 px-4' : 'px-4 h-10'
          )}
        >
          W
        </div>
        <div
          className={cn(
            'swap-off bg-black text-white text-center flex justify-center items-center rounded-box',
            large ? 'w-24 h-24' : 'px-4 h-10'
          )}
        >
          B
        </div>
      </label>
    </div>
  );
});

/**
 * Combined edit and touch controls rendered as one floating bar,
 * horizontally centered to the puzzle grid. On narrow screens it falls back
 * to a two-row stacked design with a large color switch button. The layout is
 * switched with CSS only so that interactive elements are only mounted once.
 */
const GridControlsBar = memo(function GridControlsBar({
  onReset,
}: GridControlsBarProps) {
  const grid = useAtomValue(getGridAtom);
  const setGridRaw = useSetAtom(setGridRawAtom);
  const undoStack = useAtomValue(undoStackAtom);
  const redoStack = useAtomValue(redoStackAtom);
  const undoEdit = useSetAtom(undoAtom);
  const redoEdit = useSetAtom(redoAtom);
  const embedChildren = useAtomValue(embedChildrenAtom);

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

  const [inverted, setInverted] = useState(
    getSetting('flipPrimaryMouseButton')
  );
  const onColorSwitch = () => {
    setInverted(i => {
      const newValue = !i;
      mouseContext.setInverted(newValue);
      return newValue;
    });
  };

  return (
    <div className="fixed bottom-2 left-2 right-2 z-40 flex items-stretch justify-center gap-2 lg:absolute lg:bottom-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2">
      <div className="flex-1 lg:flex-initial flex flex-col lg:flex-row lg:items-center bg-base-100 shadow-xl text-base-content rounded-box">
        <div className="flex lg:hidden">
          <ScaleSlider />
        </div>
        <div className="flex shrink-0 items-center">
          <ValidatorStatus />
          <ul className="menu menu-horizontal shrink-0 justify-center flex-1 lg:flex-initial gap-2">
            <li className={cn(undoStack.length === 0 && 'disabled')}>
              <a role="button" {...tip('Undo (Z)')} onClick={undo}>
                <FiCornerUpLeft />
              </a>
            </li>
            <li>
              <a role="button" {...tip('Restart (R)')} onClick={restart}>
                <FiRefreshCcw />
              </a>
            </li>
            <li className={cn(redoStack.length === 0 && 'disabled')}>
              <a role="button" {...tip('Redo (Y)')} onClick={redo}>
                <FiCornerUpRight />
              </a>
            </li>
          </ul>
          <FloodFillToggle />
        </div>
        <div className="hidden lg:flex w-72">
          <ScaleSlider />
        </div>
      </div>
      <div className="shrink-0 flex items-center bg-base-100 shadow-xl text-base-content rounded-box">
        <div className="lg:hidden">
          <ColorSwap large inverted={inverted} onSwitch={onColorSwitch} />
        </div>
        <div className="hidden lg:flex h-full">
          <ColorSwap inverted={inverted} onSwitch={onColorSwitch} />
        </div>
      </div>
    </div>
  );
});

export default GridControlsBar;

export function SolveGridControls() {
  const grid = useAtomValue(getGridAtom);
  const setGrid = useSetAtom(setGridAtom);
  const search = useSearch({ from: undefined, strict: false });
  return (
    <GridControlsBar
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

export function EditorGridControls() {
  const grid = useAtomValue(getGridAtom);
  const setGrid = useSetAtom(setGridAtom);
  return (
    <GridControlsBar
      onReset={() => {
        const newGrid = grid.resetTiles();
        if (newGrid.equals(grid)) return;
        setGrid(newGrid);
      }}
    />
  );
}

export interface PerfectionGridControlsProps {
  onReset?: () => void;
}

export function PerfectionGridControls({
  onReset,
}: PerfectionGridControlsProps) {
  const grid = useAtomValue(getGridAtom);
  const setGridRaw = useSetAtom(setGridRawAtom);
  const clearHistory = useSetAtom(clearHistoryAtom);
  const search = useSearch({ from: undefined, strict: false });

  if (onReset) return <GridControlsBar onReset={onReset} />;

  return (
    <GridControlsBar
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

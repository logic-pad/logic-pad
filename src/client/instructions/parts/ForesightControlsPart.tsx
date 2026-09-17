import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { PartPlacement, PartSpec } from './types';
import ForesightRule, {
  instance as foresightInstance,
} from '@logic-pad/core/data/rules/foresightRule';
import { IoIosEye } from 'react-icons/io';
import { Color, Position } from '@logic-pad/core/data/primitives';
import { useTheme } from '../../state/theme.ts';
import OutlineOverlay from '../../grid/OutlineOverlay.tsx';
import GridData from '@logic-pad/core/data/grid';
import InstructionPartPortal from '../InstructionPartPortal.tsx';
import { gridAtom, solutionAtom } from '../../state/grid.ts';
import { useAtomValue } from 'jotai';

export interface Foresight {
  grid: GridData | null;
  position: Position | null;
  message: string | null;
}

interface ForesightOverlayPartProps {
  position: Position | null;
}

const ForesightOverlayPart = memo(function ForesightOverlayPart({
  position,
}: ForesightOverlayPartProps) {
  const { theme } = useTheme();
  const grid = useAtomValue(gridAtom);
  const accentColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-accent')!)
        .color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  const positions = useMemo(() => (position ? [[position]] : null), [position]);

  if (positions === null) return null;
  return (
    <OutlineOverlay
      positions={positions}
      width={grid.width}
      height={grid.height}
      color={accentColor}
    ></OutlineOverlay>
  );
});

export interface ForesightControlsPartProps {
  instruction: ForesightRule;
}

const animationInterval = 0.1;

export default memo(function ForesightControlsPart({
  instruction,
}: ForesightControlsPartProps) {
  const grid = useAtomValue(gridAtom);
  const solution = useAtomValue(solutionAtom);
  const [foresight, setForesightRaw] = useState<Foresight>(() => ({
    grid: null,
    position: null,
    message: null,
  }));
  const [charges, setCharges] = useState(0);
  const [progress, setProgress] = useState(0);

  const setForesight = useCallback(
    (
      grid: GridData | null,
      position: Position | null,
      message: string | null
    ) => {
      setForesightRaw({ grid, position, message });
    },
    [setForesightRaw]
  );

  useEffect(() => {
    if (instruction.startFull) {
      setCharges(instruction.count);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setInterval(() => {
      setProgress(p =>
        Math.min(100, p + (100 / instruction.regenInterval) * animationInterval)
      );
    }, animationInterval * 1000);
    return () => clearInterval(handle);
  }, [instruction.regenInterval]);

  useEffect(() => {
    if (progress >= 100) {
      setCharges(c => Math.min(instruction.count, c + 1));
      setProgress(0);
    }
  }, [progress, instruction.count]);

  useEffect(() => {
    if (
      foresight.grid === null &&
      (foresight.message != null || foresight.position != null)
    ) {
      setForesight(foresight.grid, null, null);
    } else if (foresight.grid !== grid && foresight.grid !== null) {
      setForesight(null, null, null);
    }
  }, [foresight, grid, setForesight]);

  if (!solution) return null;

  return (
    <>
      {foresight.message && (
        <div className="card grow-0 shrink-0 card-side rounded-none bg-primary/10">
          <figure className="shrink-0 p-2">
            <IoIosEye size={16} />
          </figure>
          <div className="card-body p-4">
            <p>{foresight.message}</p>
          </div>
        </div>
      )}
      <div className="grow-0 shrink-0 bg-primary/10 flex flex-col items-stretch">
        <div className="flex gap-2 justify-around items-center">
          <button
            type="button"
            className="btn btn-ghost text-lg"
            disabled={charges <= 0 || !solution}
            onClick={() => {
              setCharges(c => c - 1);
              const errors: Position[] = [];
              const noGray = !!grid.musicGrid.value;
              grid.forEach((tile, x, y) => {
                const solutionTile = solution.getTile(x, y);
                if (
                  !solutionTile.exists ||
                  !tile.exists ||
                  tile.color === Color.Gray ||
                  (noGray && tile.color === Color.Light)
                )
                  return;
                if (solutionTile.color !== tile.color) {
                  errors.push({ x, y });
                }
              });
              if (errors.length === 0) {
                let nextPos: Position | null = null;
                for (const pos of instruction.solvePath) {
                  const tile = grid.getTile(pos.x, pos.y);
                  if (tile.exists && tile.color === Color.Gray) {
                    nextPos = pos;
                    break;
                  }
                }
                if (nextPos) {
                  setForesight(
                    grid,
                    nextPos,
                    'Your progress is correct. Now look at this tile'
                  );
                } else {
                  setForesight(grid, null, 'Your progress is correct');
                }
              } else if (errors.length === 1) {
                setForesight(
                  grid,
                  errors[0],
                  'This tile is wrong, but all others are correct'
                );
              } else {
                setForesight(
                  grid,
                  errors[0],
                  "Multiple tiles are wrong. Here's one of them"
                );
              }
            }}
          >
            <IoIosEye />
            Foresight
          </button>
          <span>
            <span className="text-2xl text-primary inline-block mr-2 font-bold">
              {charges}
            </span>
            remaining
          </span>
        </div>
        <progress
          className="progress progress-primary"
          value={charges >= instruction.count ? 100 : progress}
          max="100"
        ></progress>
      </div>
      <InstructionPartPortal placement={PartPlacement.MainGridOverlay}>
        <ForesightOverlayPart position={foresight.position} />
      </InstructionPartPortal>
    </>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.LeftBottom,
  instructionId: foresightInstance.id,
};

import { memo, Ref, useImperativeHandle, useMemo, useState } from 'react';
import { Position } from '@logic-pad/core/data/primitives';
import { useAtomValue } from 'jotai';
import OutlineOverlay from '../../grid/OutlineOverlay';
import InstructionPartPortal from '../../instructions/InstructionPartPortal';
import { PartPlacement } from '../../instructions/parts/types';
import { useTheme } from '../../state/theme';
import { getGridAtom } from '../../state/grid';

export interface InsightOverlayHandle {
  setPositions: (
    positions: Position[] | null,
    color: 'accent' | 'info'
  ) => void;
}

const InsightOverlayRenderer = memo(function InsightOverlay({
  positions,
  color,
}: {
  positions: Position[] | null;
  color: 'accent' | 'info';
}) {
  const { theme } = useTheme();
  const grid = useAtomValue(getGridAtom);
  const accentColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-accent')!)
        .color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );
  const infoColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-info')!).color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  const positionsArray = useMemo(
    () => (positions ? [positions] : null),
    [positions]
  );

  if (positionsArray === null) return null;
  return (
    <OutlineOverlay
      positions={positionsArray}
      width={grid.width}
      height={grid.height}
      color={color === 'accent' ? accentColor : infoColor}
    ></OutlineOverlay>
  );
});

export default memo(function InsightOverlay({
  ref,
}: {
  ref: Ref<InsightOverlayHandle>;
}) {
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [color, setColor] = useState<'accent' | 'info'>('accent');
  useImperativeHandle(
    ref,
    () => ({
      setPositions: (
        positions: Position[] | null,
        color: 'accent' | 'info'
      ) => {
        setPositions(positions);
        setColor(color);
      },
    }),
    [setPositions]
  );
  return (
    <InstructionPartPortal placement={PartPlacement.MainGridOverlay}>
      <InsightOverlayRenderer positions={positions} color={color} />
    </InstructionPartPortal>
  );
});

import { memo, useMemo } from 'react';
import { Position } from '@logic-pad/core/data/primitives';
import OutlineOverlay from './OutlineOverlay';
import { useTheme } from '../state/theme.ts';

export interface ErrorOverlayProps {
  positions: readonly (readonly Position[])[];
  width: number;
  height: number;
}

export default memo(function ErrorOverlay({
  positions,
  width,
  height,
}: ErrorOverlayProps) {
  const { theme } = useTheme();

  const errorColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-error')!)
        .color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  return (
    <OutlineOverlay
      positions={positions}
      color={errorColor}
      width={width}
      height={height}
    ></OutlineOverlay>
  );
});

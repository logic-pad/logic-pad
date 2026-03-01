import React, { memo } from 'react';
import GridData from '@logic-pad/core/data/grid';
import { Color } from '@logic-pad/core/data/primitives';
import CanvasGrid from './canvasGrid/Grid';
import DOMGrid from './domGrid/Grid';
import { useReducedMotion } from '../contexts/SettingsContext.tsx';

export interface GridProps {
  size: number;
  grid: GridData;
  editable: boolean;
  onTileClick?: (x: number, y: number, target: Color, flood: boolean) => void;
  bleed?: number | { top: number; right: number; bottom: number; left: number };
  children?: React.ReactNode;
  className?: string;
}

export default memo(function Grid({
  type,
  ...props
}: GridProps & { type?: 'dom' | 'canvas' | 'auto' }) {
  type ??= 'auto';
  const prefersReducedMotion = useReducedMotion();
  if (
    type === 'canvas' ||
    (type === 'auto' &&
      (props.grid.width * props.grid.height > 500 || prefersReducedMotion))
  ) {
    return <CanvasGrid {...props} />;
  }
  return <DOMGrid {...props} />;
});

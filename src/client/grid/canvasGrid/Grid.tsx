import { memo, useEffect, useMemo, useRef } from 'react';
import { array } from '@logic-pad/core/data/dataHelper';
import { cn } from '../../../client/uiHelper.ts';
import { type GridProps } from '../Grid';
import PointerCaptureOverlay from '../PointerCaptureOverlay';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import { ColorInfo, clearTile, renderTile } from './tile';
import GridData from '@logic-pad/core/data/grid';
import TileConnections from '@logic-pad/core/data/tileConnections';
import { useMaxCanvasSize } from '../canvasHelper.ts';

interface GridRenderData {
  grid: GridData;
  connections: TileConnections[][];
  size: number;
  colorInfo: ColorInfo;
}

export default memo(function Grid({
  size,
  grid,
  editable,
  onTileClick,
  bleed,
  children,
  className,
}: GridProps) {
  const maxSize = useMaxCanvasSize();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtx = useRef<CanvasRenderingContext2D | null>(null);
  const prevData = useRef<GridRenderData | null>(null);
  const { theme } = useTheme();
  const containerStyle = useMemo(
    () => ({
      width: `${size * grid.width}px`,
      height: `${size * grid.height}px`,
      minWidth: `${size * grid.width}px`,
      minHeight: `${size * grid.height}px`,
      fontSize: `${size}px`,
    }),
    [size, grid.width, grid.height]
  );
  const tileConnections = useMemo(
    () =>
      array(grid.width, grid.height, (x, y) =>
        grid.connections.getForTile({ x, y })
      ),
    [grid.connections, grid.width, grid.height]
  );

  const colorInfo = useMemo<ColorInfo>(
    () => ({
      black: window.getComputedStyle(
        document.getElementById('color-ref-black')!
      ).color,
      white: window.getComputedStyle(
        document.getElementById('color-ref-white')!
      ).color,
      neutral: window.getComputedStyle(
        document.getElementById('color-ref-neutral-content')!
      ).color,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  const scale = useMemo(() => {
    if (grid.width * size <= maxSize && grid.height * size <= maxSize) {
      return 1;
    }
    return Math.min(
      maxSize / (grid.width * size),
      maxSize / (grid.height * size)
    );
  }, [grid.width, grid.height, size, maxSize]);

  useEffect(() => {
    canvasCtx.current ??= canvasRef.current?.getContext('2d') ?? null;
    if (!canvasCtx.current) return;
    const renderSize = size * scale;
    const ctx = canvasCtx.current;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        const oldTile = prevData.current?.grid.getTile(x, y);
        if (
          prevData.current?.colorInfo === colorInfo &&
          prevData.current?.size === renderSize &&
          prevData.current?.grid.width === grid.width &&
          prevData.current?.grid.height === grid.height &&
          oldTile?.equals(tile) &&
          prevData.current?.connections[y]?.[x]?.equals(tileConnections[y][x])
        )
          continue;
        clearTile(ctx, x, y, renderSize);
        if (!tile.exists) continue;
        renderTile(
          ctx,
          x,
          y,
          renderSize,
          tile,
          tileConnections[y][x],
          colorInfo
        );
      }
    }
    prevData.current = {
      grid,
      connections: tileConnections,
      size: renderSize,
      colorInfo,
    };
  }, [grid, size, canvasCtx, colorInfo, tileConnections, scale]);

  return (
    <div
      className={cn('relative select-none', className)}
      style={containerStyle}
    >
      <canvas
        ref={canvasRef}
        width={grid.width * size * scale}
        height={grid.height * size * scale}
        style={useMemo(
          () => ({
            transformOrigin: 'top left',
            transform: `scale(${1 / scale})`,
          }),
          [scale]
        )}
        className="absolute inset-0"
      >
        {`Grid with ${grid.width} by ${grid.height} tiles.`}
        {grid.tiles
          .map(
            (row, line) =>
              `Row ${line + 1}: ${row
                .map(tile => {
                  if (!tile.exists) return 'empty';
                  if (tile.fixed) {
                    return tile.color.toUpperCase();
                  } else {
                    return tile.color.toLowerCase();
                  }
                })
                .join(' ')}`
          )
          .join('\n')}
      </canvas>
      <PointerCaptureOverlay
        width={grid.width}
        height={grid.height}
        colorMap={(x, y, color) => grid.getTile(x, y).color === color}
        onTileClick={(x, y, _from, to, flood) => {
          if (editable && grid.getTile(x, y).exists)
            onTileClick?.(x, y, to, flood);
        }}
        allowDrag={true}
        allowReplace={true}
        step={1}
        bleed={bleed}
      />
      {children}
    </div>
  );
});

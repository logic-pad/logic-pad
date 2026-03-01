import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Position } from '@logic-pad/core/data/primitives';
import { array } from '@logic-pad/core/data/dataHelper';
import GridCanvasOverlay, { RawCanvasRef } from './GridCanvasOverlay';

export interface OutlineOverlayProps {
  positions: readonly (readonly Position[])[];
  color: string;
  width: number;
  height: number;
}

function positionsToGrid(positions: readonly Position[]) {
  let width = 0;
  let height = 0;
  for (const { x, y } of positions) {
    if (width === 0 || x > width) {
      width = x;
    }
    if (height === 0 || y > height) {
      height = y;
    }
  }
  const grid = array(width + 1, height + 1, () => false);
  for (const { x, y } of positions) {
    grid[y][x] = true;
  }
  return grid;
}

const BLEED = 15;

export default memo(function OutlineOverlay({
  positions,
  color,
  width,
  height,
}: OutlineOverlayProps) {
  const canvasRef = useRef<RawCanvasRef>(null);
  const [tileSize, setTileSize] = useState(0);
  const grid = useMemo(
    () => positions.map(list => positionsToGrid(list)),
    [positions]
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    if (tileSize === 0) return;
    const { ctx } = canvasRef.current;
    ctx.clearRect(
      -BLEED,
      -BLEED,
      width * tileSize + 2 * BLEED,
      height * tileSize + 2 * BLEED
    );

    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    ctx.strokeStyle = color;
    ctx.lineWidth = tileSize * 0.15;
    ctx.lineCap = 'round';

    positions.forEach((list, idx) =>
      list.forEach(({ x, y }) => {
        if (!grid[idx][y - 1]?.[x]) {
          line(x * tileSize, y * tileSize, (x + 1) * tileSize, y * tileSize);
        }
        if (!grid[idx][y][x + 1]) {
          line(
            (x + 1) * tileSize,
            y * tileSize,
            (x + 1) * tileSize,
            (y + 1) * tileSize
          );
        }
        if (!grid[idx][y + 1]?.[x]) {
          line(
            x * tileSize,
            (y + 1) * tileSize,
            (x + 1) * tileSize,
            (y + 1) * tileSize
          );
        }
        if (!grid[idx][y][x - 1]) {
          line(x * tileSize, y * tileSize, x * tileSize, (y + 1) * tileSize);
        }
      })
    );
  }, [positions, grid, color, width, height, tileSize]);

  return (
    <GridCanvasOverlay
      ref={canvasRef}
      width={width}
      height={height}
      bleed={BLEED}
      onResize={setTileSize}
    ></GridCanvasOverlay>
  );
});

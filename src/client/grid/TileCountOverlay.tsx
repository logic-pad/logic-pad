import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import GridCanvasOverlay, { RawCanvasRef } from './GridCanvasOverlay';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Color,
  DIRECTIONS,
  Direction,
  Position,
} from '@logic-pad/core/data/primitives';
import GridData from '@logic-pad/core/data/grid';
import { mousePosition } from '../../client/uiHelper.ts';
import ViewpointSymbol, {
  instance as viewpointInstance,
} from '@logic-pad/core/data/symbols/viewpointSymbol';
import FocusSymbol, {
  instance as focusInstance,
} from '@logic-pad/core/data/symbols/focusSymbol';
import MinesweeperSymbol, {
  instance as minesweeperInstance,
} from '@logic-pad/core/data/symbols/minesweeperSymbol';
import { move } from '@logic-pad/core/data/dataHelper';

export interface TileCountOverlayProps {
  grid: GridData;
}

const PADDING = 5;
const BLEED = 5;

function canvasTextBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  align: 'left' | 'right',
  text: string,
  color: string,
  fontSize: number
) {
  ctx.font = `${fontSize}px ${window.getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 5;

  const textWidth = ctx.measureText(text).width + PADDING * 2;
  const textHeight = fontSize + PADDING * 2;

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;
  if (align === 'left') ctx.fillRect(x, y, textWidth, textHeight);
  else ctx.fillRect(x - textWidth, y, textWidth, textHeight);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  if (align === 'left') ctx.strokeRect(x, y, textWidth, textHeight);
  else ctx.strokeRect(x - textWidth, y, textWidth, textHeight);

  ctx.strokeStyle = 'black';
  if (align === 'left') ctx.strokeText(text, x + PADDING, y + PADDING);
  else ctx.strokeText(text, x - textWidth + PADDING, y + PADDING);
  ctx.fillStyle = 'white';
  if (align === 'left') ctx.fillText(text, x + PADDING, y + PADDING);
  else ctx.fillText(text, x - textWidth + PADDING, y + PADDING);
}

function canvasGradientLine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  stroke:
    | string
    | CanvasGradient
    | CanvasPattern
    | ((gradient: CanvasGradient) => void)
) {
  if (typeof stroke === 'function') {
    const gradient = ctx?.createLinearGradient(startX, startY, endX, endY);
    stroke(gradient);
    stroke = gradient!;
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

export default memo(function TileCountOverlay({ grid }: TileCountOverlayProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<RawCanvasRef>(null);
  const [tileSize, setTileSize] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);

  const accentColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-accent')!)
        .color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  useHotkeys(
    'ctrl',
    e => {
      if (!canvasRef.current) return;
      if (e.type === 'keydown') {
        const rect =
          canvasRef.current.canvas.parentElement!.getBoundingClientRect(); // We need to get the container size, not the canvas size due to CSS scaling
        const tileSize = rect.width / grid.width;
        const x = Math.floor((mousePosition.clientX - rect.left) / tileSize);
        const y = Math.floor((mousePosition.clientY - rect.top) / tileSize);
        setPosition({ x, y });
      } else {
        setPosition(null);
      }
    },
    {
      keydown: true,
      keyup: true,
      preventDefault: true,
      useKey: true,
    },
    [canvasRef, grid.width, grid.height]
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    if (tileSize === 0) return;
    const { ctx } = canvasRef.current;

    ctx.clearRect(
      -BLEED,
      -BLEED,
      grid.width * tileSize + 2 * BLEED,
      grid.height * tileSize + 2 * BLEED
    );

    if (
      !position ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    )
      return;
    const tile = grid.getTile(position.x, position.y);
    if (!tile.exists) return;

    const viewpoint = grid.symbols
      .get(viewpointInstance.id)
      ?.find(
        sym =>
          Math.floor(sym.x) === position.x && Math.floor(sym.y) === position.y
      ) as ViewpointSymbol | undefined;

    if (viewpoint) {
      const textX =
        position.x < 2
          ? position.x * tileSize + tileSize + PADDING
          : position.x * tileSize - PADDING;
      const textY = position.y * tileSize;

      const count = viewpoint.countTiles(grid);
      for (const direction of DIRECTIONS) {
        let localMaxSize = 0;
        grid.iterateDirection(
          move(position, direction),
          direction,
          t => t.color === tile.color || t.color === Color.Gray,
          () => {
            localMaxSize++;
          }
        );
        const start1 = { x: 0, y: 0 };
        const start2 = { x: 0, y: 0 };
        const end1 = { x: 0, y: 0 };
        const end2 = { x: 0, y: 0 };
        switch (direction) {
          case Direction.Up:
            start1.x = position.x * tileSize;
            start1.y = position.y * tileSize;
            end1.x = position.x * tileSize;
            end1.y = Math.max(0, position.y - localMaxSize) * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = position.y * tileSize;
            end2.x = (position.x + 1) * tileSize;
            end2.y = Math.max(0, position.y - localMaxSize) * tileSize;
            break;
          case Direction.Down:
            start1.x = position.x * tileSize;
            start1.y = (position.y + 1) * tileSize;
            end1.x = position.x * tileSize;
            end1.y =
              Math.min(grid.height, position.y + 1 + localMaxSize) * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = (position.x + 1) * tileSize;
            end2.y =
              Math.min(grid.height, position.y + 1 + localMaxSize) * tileSize;
            break;
          case Direction.Left:
            start1.x = position.x * tileSize;
            start1.y = position.y * tileSize;
            end1.x = Math.max(0, position.x - localMaxSize) * tileSize;
            end1.y = position.y * tileSize;
            start2.x = position.x * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = Math.max(0, position.x - localMaxSize) * tileSize;
            end2.y = (position.y + 1) * tileSize;
            break;
          case Direction.Right:
            start1.x = (position.x + 1) * tileSize;
            start1.y = position.y * tileSize;
            end1.x =
              Math.min(grid.width, position.x + 1 + localMaxSize) * tileSize;
            end1.y = position.y * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x =
              Math.min(grid.width, position.x + 1 + localMaxSize) * tileSize;
            end2.y = (position.y + 1) * tileSize;
            break;
        }
        const gradient = ctx?.createLinearGradient(
          start1.x,
          start1.y,
          end1.x,
          end1.y
        );
        gradient?.addColorStop(0, accentColor);
        gradient?.addColorStop(
          2 / 3,
          `${accentColor.substring(0, accentColor.length - 1)}/0)`
        );
        gradient?.addColorStop(
          1,
          `${accentColor.substring(0, accentColor.length - 1)}/0)`
        );
        canvasGradientLine(ctx, start1.x, start1.y, end1.x, end1.y, gradient);
        canvasGradientLine(ctx, start2.x, start2.y, end2.x, end2.y, gradient);
      }

      canvasTextBox(
        ctx,
        textX,
        textY,
        position.x < 2 ? 'left' : 'right',
        `${count.completed}/${count.possible === Number.MAX_SAFE_INTEGER ? '?' : count.possible}`,
        accentColor,
        30
      );
      return;
    }

    const focus = grid.symbols
      .get(focusInstance.id)
      ?.find(
        sym =>
          Math.floor(sym.x) === position.x && Math.floor(sym.y) === position.y
      ) as FocusSymbol | undefined;

    if (focus) {
      const textX =
        position.x < 2
          ? position.x * tileSize + tileSize + PADDING
          : position.x * tileSize - PADDING;
      const textY = position.y * tileSize;

      const count = focus.countTiles(grid);
      for (const direction of DIRECTIONS) {
        const start1 = { x: 0, y: 0 };
        const start2 = { x: 0, y: 0 };
        const end1 = { x: 0, y: 0 };
        const end2 = { x: 0, y: 0 };
        switch (direction) {
          case Direction.Up:
            start1.x = position.x * tileSize;
            start1.y = position.y * tileSize;
            end1.x = position.x * tileSize;
            end1.y = Math.max(0, position.y - 1) * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = position.y * tileSize;
            end2.x = (position.x + 1) * tileSize;
            end2.y = Math.max(0, position.y - 1) * tileSize;
            break;
          case Direction.Down:
            start1.x = position.x * tileSize;
            start1.y = (position.y + 1) * tileSize;
            end1.x = position.x * tileSize;
            end1.y = Math.min(grid.height, position.y + 2) * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = (position.x + 1) * tileSize;
            end2.y = Math.min(grid.height, position.y + 2) * tileSize;
            break;
          case Direction.Left:
            start1.x = position.x * tileSize;
            start1.y = position.y * tileSize;
            end1.x = Math.max(0, position.x - 1) * tileSize;
            end1.y = position.y * tileSize;
            start2.x = position.x * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = Math.max(0, position.x - 1) * tileSize;
            end2.y = (position.y + 1) * tileSize;
            break;
          case Direction.Right:
            start1.x = (position.x + 1) * tileSize;
            start1.y = position.y * tileSize;
            end1.x = Math.min(grid.width, position.x + 2) * tileSize;
            end1.y = position.y * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = Math.min(grid.width, position.x + 2) * tileSize;
            end2.y = (position.y + 1) * tileSize;
            break;
        }
        const gradient = ctx?.createLinearGradient(
          start1.x,
          start1.y,
          end1.x,
          end1.y
        );
        gradient?.addColorStop(0, accentColor);
        gradient?.addColorStop(
          2 / 3,
          `${accentColor.substring(0, accentColor.length - 1)}/0)`
        );
        gradient?.addColorStop(
          1,
          `${accentColor.substring(0, accentColor.length - 1)}/0)`
        );
        canvasGradientLine(ctx, start1.x, start1.y, end1.x, end1.y, gradient);
        canvasGradientLine(ctx, start2.x, start2.y, end2.x, end2.y, gradient);
      }

      canvasTextBox(
        ctx,
        textX,
        textY,
        position.x < 2 ? 'left' : 'right',
        `${count.completed}/${count.possible === Number.MAX_SAFE_INTEGER ? '?' : count.possible}`,
        accentColor,
        30
      );
      return;
    }

    const minesweeper = grid.symbols
      .get(minesweeperInstance.id)
      ?.find(
        sym =>
          Math.floor(sym.x) === position.x && Math.floor(sym.y) === position.y
      ) as MinesweeperSymbol | undefined;

    if (minesweeper) {
      const textX =
        position.x < 2
          ? position.x * tileSize + tileSize + PADDING
          : position.x * tileSize - PADDING;
      const textY = position.y * tileSize;

      const count = minesweeper.countTiles(grid);
      for (const direction of DIRECTIONS) {
        const start1 = { x: 0, y: 0 };
        const start2 = { x: 0, y: 0 };
        const startCenter = { x: 0, y: 0 };
        const end1 = { x: 0, y: 0 };
        const end2 = { x: 0, y: 0 };
        const endCenter = { x: 0, y: 0 };
        switch (direction) {
          case Direction.Up:
            start1.x = position.x * tileSize;
            start1.y = Math.max(0, position.y - 1) * tileSize;
            end1.x = Math.max(0, position.x - 1) * tileSize;
            end1.y = Math.max(0, position.y - 1) * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = Math.max(0, position.y - 1) * tileSize;
            end2.x = Math.min(grid.width, position.x + 2) * tileSize;
            end2.y = Math.max(0, position.y - 1) * tileSize;
            startCenter.x = position.x * tileSize;
            startCenter.y = Math.max(0, position.y - 1) * tileSize;
            endCenter.x = (position.x + 1) * tileSize;
            endCenter.y = Math.max(0, position.y - 1) * tileSize;
            break;
          case Direction.Down:
            start1.x = position.x * tileSize;
            start1.y = Math.min(grid.height, position.y + 2) * tileSize;
            end1.x = Math.max(0, position.x - 1) * tileSize;
            end1.y = Math.min(grid.height, position.y + 2) * tileSize;
            start2.x = (position.x + 1) * tileSize;
            start2.y = Math.min(grid.height, position.y + 2) * tileSize;
            end2.x = Math.min(grid.width, position.x + 2) * tileSize;
            end2.y = Math.min(grid.height, position.y + 2) * tileSize;
            startCenter.x = position.x * tileSize;
            startCenter.y = Math.min(grid.height, position.y + 2) * tileSize;
            endCenter.x = (position.x + 1) * tileSize;
            endCenter.y = Math.min(grid.height, position.y + 2) * tileSize;
            break;
          case Direction.Left:
            start1.x = Math.max(0, position.x - 1) * tileSize;
            start1.y = position.y * tileSize;
            end1.x = Math.max(0, position.x - 1) * tileSize;
            end1.y = Math.max(0, position.y - 1) * tileSize;
            start2.x = Math.max(0, position.x - 1) * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = Math.max(0, position.x - 1) * tileSize;
            end2.y = Math.min(grid.height, position.y + 2) * tileSize;
            startCenter.x = Math.max(0, position.x - 1) * tileSize;
            startCenter.y = position.y * tileSize;
            endCenter.x = Math.max(0, position.x - 1) * tileSize;
            endCenter.y = (position.y + 1) * tileSize;
            break;
          case Direction.Right:
            start1.x = Math.min(grid.width, position.x + 2) * tileSize;
            start1.y = position.y * tileSize;
            end1.x = Math.min(grid.width, position.x + 2) * tileSize;
            end1.y = Math.max(0, position.y - 1) * tileSize;
            start2.x = Math.min(grid.width, position.x + 2) * tileSize;
            start2.y = (position.y + 1) * tileSize;
            end2.x = Math.min(grid.width, position.x + 2) * tileSize;
            end2.y = Math.min(grid.height, position.y + 2) * tileSize;
            startCenter.x = Math.min(grid.width, position.x + 2) * tileSize;
            startCenter.y = position.y * tileSize;
            endCenter.x = Math.min(grid.width, position.x + 2) * tileSize;
            endCenter.y = (position.y + 1) * tileSize;
            break;
        }
        const gradientFunc = (g: CanvasGradient) => {
          g.addColorStop(0, accentColor);
          g.addColorStop(
            2 / 3,
            `${accentColor.substring(0, accentColor.length - 1)}/0)`
          );
          g.addColorStop(
            1,
            `${accentColor.substring(0, accentColor.length - 1)}/0)`
          );
        };
        canvasGradientLine(
          ctx,
          start1.x,
          start1.y,
          end1.x,
          end1.y,
          gradientFunc
        );
        canvasGradientLine(
          ctx,
          start2.x,
          start2.y,
          end2.x,
          end2.y,
          gradientFunc
        );
        canvasGradientLine(
          ctx,
          startCenter.x,
          startCenter.y,
          endCenter.x,
          endCenter.y,
          accentColor
        );
      }

      canvasTextBox(
        ctx,
        textX,
        textY,
        position.x < 2 ? 'left' : 'right',
        `${count.completed}/${count.possible === Number.MAX_SAFE_INTEGER ? '?' : count.possible}`,
        accentColor,
        30
      );
      return;
    }

    const textX =
      position.x < 2
        ? position.x * tileSize + tileSize + PADDING
        : position.x * tileSize - PADDING;
    const textY = position.y * tileSize;

    const positions: Position[] = [];
    grid.iterateArea(
      position,
      t => t.exists && t.color === tile.color,
      (_, x, y) => {
        positions.push({ x, y });
      }
    );

    positions.forEach(({ x, y }) => {
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(
        Math.floor(x * tileSize),
        Math.floor(y * tileSize),
        Math.floor((x + 1) * tileSize) - Math.floor(x * tileSize),
        Math.floor((y + 1) * tileSize) - Math.floor(y * tileSize)
      );
      ctx.globalAlpha = 1;
    });

    canvasTextBox(
      ctx,
      textX,
      textY,
      position.x < 2 ? 'left' : 'right',
      `${positions.length}`,
      accentColor,
      30
    );
  }, [grid, position, accentColor, tileSize]);

  return (
    <GridCanvasOverlay
      ref={canvasRef}
      width={grid.width}
      height={grid.height}
      bleed={BLEED}
      onResize={setTileSize}
    ></GridCanvasOverlay>
  );
});

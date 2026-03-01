import { PartPlacement, PartSpec } from './types';
import { memo, useEffect, useRef, useState } from 'react';
import PerfectionRule, {
  instance as perfectionInstance,
} from '@logic-pad/core/data/rules/perfectionRule';
import { useGrid } from '../../contexts/GridContext';
import { useSolvePath } from '../../contexts/SolvePathContext';
import GridCanvasOverlay, { RawCanvasRef } from '../../grid/GridCanvasOverlay';

const BLEED = 0;

function canvasTextBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  padding: number,
  text: string,
  fontSize: number
) {
  ctx.font = `${fontSize}px ${window.getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 5;

  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'black';
  ctx.strokeText(text, x + padding, y + padding);
  ctx.fillStyle = 'white';
  ctx.fillText(text, x + padding, y + padding);
}

const PerfectionOverlay = memo(function PerfectionOverlay() {
  const canvasRef = useRef<RawCanvasRef>(null);
  const [tileSize, setTileSize] = useState(0);
  const { grid } = useGrid();
  const { solvePath } = useSolvePath();

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

    solvePath.forEach((position, index) => {
      const x = position.x * tileSize;
      const y = position.y * tileSize;
      const text = (index + 1).toString();
      canvasTextBox(ctx, x, y, tileSize / 8, text, tileSize / 4);
    });
  }, [solvePath, grid, tileSize, grid.width, grid.height]);

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

export interface PerfectionOverlayPartProps {
  instruction: PerfectionRule;
}

export default memo(function PerfectionOverlayPart({
  instruction,
}: PerfectionOverlayPartProps) {
  const { solvePath, visualizeSolvePath } = useSolvePath();

  if (!visualizeSolvePath || solvePath.length === 0 || instruction.editor)
    return null;
  return <PerfectionOverlay />;
});

export const spec: PartSpec = {
  placement: PartPlacement.MainGridOverlay,
  instructionId: perfectionInstance.id,
};

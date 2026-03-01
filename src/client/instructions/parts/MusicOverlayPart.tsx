import { InstructionPartProps, PartPlacement, PartSpec } from './types';
import MusicGridRule, {
  instance as musicGridInstance,
} from '@logic-pad/core/data/rules/musicGridRule';
import { memo, use, useEffect, useMemo, useRef, useState } from 'react';
import { useGrid } from '../../contexts/GridContext.tsx';
import GridCanvasOverlay, { RawCanvasRef } from '../../grid/GridCanvasOverlay';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import { Color } from '@logic-pad/core/data/primitives';

const ToneImport = import('tone');
const instrumentsImport = import('./instruments.ts');

const BLEED = 5;

export type MusicOverlayPartProps = InstructionPartProps<MusicGridRule>;

/**
 * Convert the pointer position in track to pointer position in grid with the same playtime.
 */
function interpolateTrackPosition(
  positionInTrack: number,
  instruction: MusicGridRule
): number {
  if (instruction.track?.musicGrid.value === undefined) return positionInTrack;
  let trackBpm = 120;
  let gridBpm = 120;
  let positionInGrid = 0;
  for (let i = 0; i < positionInTrack; i++) {
    const trackColumn = instruction.track.musicGrid.value.controlLines.find(
      x => x.column === i
    );
    const gridColumn = instruction.controlLines.find(x => x.column === i);
    if (trackColumn) trackBpm = trackColumn.bpm ?? trackBpm;
    if (gridColumn) gridBpm = gridColumn.bpm ?? gridBpm;
    positionInGrid += (gridBpm / trackBpm) * Math.min(1, positionInTrack - i);
  }
  return positionInGrid;
}

export default memo(function MusicOverlayPart({
  instruction,
}: MusicOverlayPartProps) {
  const Tone = use(ToneImport);
  const { playbackState } = use(instrumentsImport);
  const { grid } = useGrid();
  const canvasRef = useRef<RawCanvasRef>(null);
  const [tileSize, setTileSize] = useState(0);
  const targetRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const tileAnimations = useRef<number[][]>([]);
  const prevPosition = useRef(-1);
  const targetPosition = useRef(0);

  useEffect(() => {
    tileAnimations.current = Array.from({ length: grid.height }, () =>
      Array.from({ length: grid.width }, () => 0)
    );
  }, [grid.height, grid.width]);

  const infoColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-info')!).color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  const accentColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-accent')!)
        .color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  useEffect(() => {
    const handler = () => {
      prevPosition.current = -1;
    };
    Tone.getTransport().on('stop', handler);
    return () => {
      Tone.getTransport().off('stop', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shouldUpdatePosition = useRef<boolean>(false);

  useEffect(() => {
    const handle = Tone.getTransport().scheduleRepeat(
      time => {
        Tone.getDraw().schedule(() => {
          const position = playbackState.isSolution
            ? interpolateTrackPosition(
                Tone.getTransport().ticks / Tone.getTransport().PPQ,
                instruction
              )
            : Tone.getTransport().ticks / Tone.getTransport().PPQ;
          const prevPos = prevPosition.current;
          prevPosition.current = position;
          if (canvasRef.current && tileSize !== 0) {
            const { ctx } = canvasRef.current;
            ctx.clearRect(
              -BLEED,
              -BLEED,
              grid.width * tileSize + BLEED * 2,
              grid.height * tileSize + BLEED * 2
            );
            if (!playbackState.isSolution) {
              for (let y = 0; y < grid.height; y++) {
                for (let x = 0; x < grid.width; x++) {
                  if (tileAnimations.current[y][x] > 0) {
                    ctx.fillStyle = `${accentColor.substring(0, accentColor.length - 2)}/${
                      tileAnimations.current[y][x]
                    })`;
                    ctx.fillRect(
                      x * tileSize,
                      y * tileSize,
                      tileSize,
                      tileSize
                    );
                    tileAnimations.current[y][x] /= 1.06;
                  }
                }
              }
              if (position >= grid.width || position <= 0) return;
              const column = Math.floor(position);
              if (column !== Math.floor(prevPos)) {
                const playbackGrid = playbackState.playback?.grid ?? grid;
                for (let y = 0; y < playbackGrid.height; y++) {
                  const tile = playbackGrid.getTile(column, y);
                  if (!tile.exists || tile.color !== Color.Dark) continue;
                  if (tileAnimations.current.length <= y) continue;
                  if (tileAnimations.current[y].length <= column) continue;
                  tileAnimations.current[y][column] = 0.7;
                }
              }
            }
            if (position >= grid.width || position <= 0) return;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(position * tileSize, 0);
            ctx.lineTo(position * tileSize, grid.height * tileSize);
            ctx.lineWidth = 5;
            ctx.strokeStyle = playbackState.isSolution
              ? infoColor
              : accentColor;
            ctx.stroke();
            targetPosition.current = position;
            shouldUpdatePosition.current = true;
          }
        }, time);
      },
      0.01,
      0
    );
    return () => {
      Tone.getTransport().clear(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, instruction, infoColor, accentColor, tileSize]);

  useEffect(() => {
    const handle = setInterval(() => {
      if (
        Tone.getTransport().state === 'started' &&
        targetRef.current &&
        shouldUpdatePosition.current
      ) {
        targetRef.current.style.left = `${targetPosition.current}em`;
        targetRef.current.scrollIntoView({ behavior: 'instant' });
        shouldUpdatePosition.current = false;
      }
    }, 1000 / 30);
    return () => {
      clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GridCanvasOverlay
      ref={canvasRef}
      width={grid.width}
      height={grid.height}
      bleed={BLEED}
      onResize={setTileSize}
    >
      <div
        ref={targetRef}
        className="absolute w-48 h-0 opacity-0 -top-12 xl:top-1/2"
      ></div>
    </GridCanvasOverlay>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.MainGridOverlay,
  instructionId: musicGridInstance.id,
};

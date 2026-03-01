import { memo, useRef } from 'react';
import ToolboxItem from '../../editor/ToolboxItem';
import { PartPlacement, PartSpec } from './types';
import { instance as musicGridInstance } from '@logic-pad/core/data/rules/musicGridRule';
import { useGrid } from '../../contexts/GridContext.tsx';
import GridOverlay from '../../grid/GridOverlay';
import { PiMetronomeFill } from 'react-icons/pi';
import PointerCaptureOverlay from '../../grid/PointerCaptureOverlay';
import { Color } from '@logic-pad/core/data/primitives';
import { ControlLine } from '@logic-pad/core/data/rules/musicControlLine';
import {
  getConfigurableLocation,
  useConfig,
} from '../../contexts/ConfigContext.tsx';
import { IoMdFlag } from 'react-icons/io';

const PlaybackOverlay = memo(function PlaybackOverlay() {
  const { setLocation, setRef } = useConfig();
  const { grid, setGrid } = useGrid();
  const musicGrid = grid.musicGrid.value;
  const controlLineOverlayRef =
    useRef<Map<number, HTMLDivElement | null>>(null);

  if (!musicGrid) return null;
  return (
    <>
      <PointerCaptureOverlay
        width={grid.width}
        height={grid.height}
        allowDrag={false}
        colorMap={(x, _y, color) => {
          if (color !== Color.Dark) return false;
          return musicGrid.controlLines.some(
            line =>
              line.column === x &&
              (line.bpm != null || line.pedal !== null || line.checkpoint)
          );
        }}
        onTileClick={(x, _y, from, _to) => {
          if (from === Color.Dark) {
            setLocation(
              getConfigurableLocation(
                grid,
                musicGrid.controlLines.find(line => line.column === x)!
              )
            );
            setRef({
              current: (controlLineOverlayRef.current?.get(x) ?? undefined)!,
            });
          } else {
            setGrid(
              grid.replaceRule(
                musicGrid,
                musicGrid.setControlLine(
                  musicGrid.controlLines
                    .find(line => line.column === x)
                    ?.copyWith({ bpm: 120, pedal: null, checkpoint: false }) ??
                    new ControlLine(x, 120, null, false, [])
                )
              )
            );
          }
        }}
      />
      <GridOverlay>
        {musicGrid.controlLines
          .filter(
            line => line.bpm !== null || line.pedal != null || line.checkpoint
          )
          .map(line => (
            <div
              ref={el => {
                controlLineOverlayRef.current ??= new Map();
                const map = controlLineOverlayRef.current;
                map.set(line.column, el);
                return () => {
                  map.delete(line.column);
                };
              }}
              key={line.column}
              className="absolute top-0 h-[calc(100%+0.7em)] w-[1em] border-l-[0.1em] border-secondary"
              style={{ left: `${line.column}em` }}
            >
              <div className="absolute inset-0 bottom-[0.7em] bg-linear-to-r from-secondary via-20% via-secondary/20 to-secondary/0"></div>
              {line.checkpoint && (
                <div className="badge badge-secondary absolute bottom-[3.2em] text-[0.15em] h-[1.3em] rounded-l-none whitespace-nowrap pl-0">
                  <IoMdFlag size="1.3em" />
                </div>
              )}
              {line.pedal !== null && (
                <div className="badge badge-secondary absolute bottom-[1.6em] text-[0.15em] h-[1.3em] rounded-l-none whitespace-nowrap pl-0">
                  {line.pedal ? 'Pedal Down' : 'Pedal Up'}
                </div>
              )}
              {line.bpm !== null && (
                <div className="badge badge-secondary absolute bottom-0 text-[0.15em] h-[1.3em] rounded-l-none whitespace-nowrap pl-0">
                  BPM: {line.bpm}
                </div>
              )}
            </div>
          ))}
      </GridOverlay>
    </>
  );
});

export default memo(function ConfigurePlaybackTool() {
  return (
    <ToolboxItem
      id="music_playback"
      order={305}
      hotkey="extraSymbols-6"
      name="Configure playback"
      description="Click on a column to add a control line. Configure the line for playback."
      gridOverlay={<PlaybackOverlay />}
      onTileClick={null}
    >
      <PiMetronomeFill />
    </ToolboxItem>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.Toolbox,
  instructionId: musicGridInstance.id,
};

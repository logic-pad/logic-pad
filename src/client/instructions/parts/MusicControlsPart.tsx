import { Suspense, lazy, memo, useEffect, useRef, useState } from 'react';
import { useGrid } from '../../contexts/GridContext.tsx';
import { InstructionPartProps, PartPlacement, PartSpec } from './types';
import MusicGridRule, {
  instance as musicGridInstance,
} from '@logic-pad/core/data/rules/musicGridRule';
import { RiHeadphoneFill, RiStopLargeFill } from 'react-icons/ri';
import { FaPlay } from 'react-icons/fa';
import Loading from '../../components/Loading';
import { Color } from '@logic-pad/core/data/primitives';
import { array } from '@logic-pad/core/data/dataHelper';
import GridData from '@logic-pad/core/data/grid';
import type { CachedPlayback } from './instruments.ts';
import { useSuspenseQueries } from '@tanstack/react-query';

const ToneImport = import('tone');
const instrumentsImport = import('./instruments.ts');

export type MusicControlsPartProps = InstructionPartProps<MusicGridRule>;

const MusicControls = lazy(async function () {
  const [
    Tone,
    {
      cleanUp,
      instruments,
      getInstrumentsUsed,
      playGrid,
      playImmediate,
      playbackState,
    },
  ] = await Promise.all([ToneImport, instrumentsImport]);
  return {
    default: memo(function MusicControls({
      instruction,
    }: MusicControlsPartProps) {
      useSuspenseQueries({
        queries: Array.from(getInstrumentsUsed(instruction)).map(
          instrument => ({
            queryKey: ['instrument', instrument],
            queryFn: async () => {
              const instr = instruments[instrument];
              if (!instr) throw new Error(`Unknown instrument: ${instrument}`);
              await instr.load();
              return instr;
            },
            retry: false,
            staleTime: Infinity,
            cacheTime: Infinity,
          })
        ),
      });
      const { grid, solution } = useGrid();
      const previousGrid = useRef<GridData | null>(null);
      const [playState, setPlayState] = useState<'listen' | 'play' | 'none'>(
        'none'
      );

      useEffect(() => {
        if (
          previousGrid.current &&
          !previousGrid.current.colorEquals(grid) &&
          previousGrid.current.width === grid.width &&
          previousGrid.current.height === grid.height &&
          playState === 'none'
        ) {
          playImmediate(grid, previousGrid.current, instruction);
        }
        previousGrid.current = grid;
      }, [grid, instruction, playState]);

      const stopAll = (playback: CachedPlayback | undefined) => {
        cleanUp(playback);
        setPlayState('none');
      };

      useEffect(() => {
        return () => stopAll(playbackState.playback);
      }, []);

      useEffect(() => {
        stopAll(playbackState.playback);
      }, [grid.width, grid.height]);

      useEffect(() => {
        const handler = () => {
          setPlayState('none');
        };
        Tone.getTransport().on('stop', handler);
        return () => {
          Tone.getTransport().off('stop', handler);
        };
      }, []);

      return (
        <>
          {(instruction.track ?? solution) && (
            <button
              type="button"
              className="btn btn-ghost text-lg"
              onClick={() => {
                if (playState === 'listen') {
                  stopAll(playbackState.playback);
                } else {
                  if (instruction.track) {
                    const musicGrid = instruction.track.musicGrid.value;
                    if (!musicGrid) return;
                    playbackState.playback = playGrid(
                      instruction.track,
                      musicGrid,
                      true,
                      () => setPlayState('none'),
                      playbackState.playback
                    );
                  } else {
                    const tiles = array(
                      solution?.width ?? grid.width,
                      solution?.height ?? grid.height,
                      (x, y) => {
                        const gridTile = grid.getTile(x, y);
                        if (!solution) return gridTile;
                        const tile = solution.getTile(x, y);
                        if (tile.exists && tile.color !== Color.Gray)
                          return tile;
                        return gridTile;
                      }
                    );
                    playbackState.playback = playGrid(
                      grid.withTiles(tiles),
                      instruction,
                      true,
                      () => setPlayState('none'),
                      playbackState.playback
                    );
                  }
                  Tone.getTransport().once('start', () =>
                    setPlayState('listen')
                  );
                }
              }}
            >
              {playState === 'listen' ? (
                <>
                  <RiStopLargeFill />
                  Stop
                </>
              ) : (
                <>
                  <RiHeadphoneFill />
                  Listen
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost text-lg"
            onClick={() => {
              if (playState === 'play') {
                stopAll(playbackState.playback);
              } else {
                playbackState.playback = playGrid(
                  grid,
                  instruction,
                  false,
                  () => setPlayState('none'),
                  playbackState.playback
                );
                Tone.getTransport().once('start', () => setPlayState('play'));
              }
            }}
          >
            {playState === 'play' ? (
              <>
                <RiStopLargeFill />
                Stop
              </>
            ) : (
              <>
                <FaPlay />
                Play
              </>
            )}
          </button>
        </>
      );
    }),
  };
});

export default memo(function MusicControlsPart({
  instruction,
}: MusicControlsPartProps) {
  return (
    <div className="grow-0 shrink-0 bg-primary/10 flex justify-around">
      <Suspense fallback={<Loading />}>
        <MusicControls instruction={instruction} />
      </Suspense>
    </div>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.LeftPanel,
  instructionId: musicGridInstance.id,
};

import { memo, useRef } from 'react';
import ToolboxItem from '../../editor/ToolboxItem';
import { PartPlacement, PartSpec } from './types';
import { instance as musicGridInstance } from '@logic-pad/core/data/rules/musicGridRule';
import { useGrid } from '../../contexts/GridContext.tsx';
import GridOverlay from '../../grid/GridOverlay';
import PointerCaptureOverlay from '../../grid/PointerCaptureOverlay';
import { Color } from '@logic-pad/core/data/primitives';
import { ControlLine, Row } from '@logic-pad/core/data/rules/musicControlLine';
import {
  getConfigurableLocation,
  useConfig,
} from '../../contexts/ConfigContext.tsx';
import { IoMusicalNote } from 'react-icons/io5';

const NoteOverlay = memo(function NoteOverlay() {
  const { setLocation, setRef } = useConfig();
  const { grid, setGrid } = useGrid();
  const musicGrid = grid.musicGrid.value;
  const noteOverlayRef = useRef<Map<string, HTMLDivElement | null>>(null);

  if (!musicGrid) return null;
  return (
    <>
      <PointerCaptureOverlay
        width={grid.width}
        height={grid.height}
        allowDrag={false}
        colorMap={(x, y, color) => {
          if (color !== Color.Dark) return false;
          return musicGrid.controlLines.some(
            line =>
              line.column === x &&
              !!line.rows[y] &&
              (line.rows[y].note !== null ||
                line.rows[y].instrument !== null ||
                line.rows[y].velocity !== null)
          );
        }}
        onTileClick={(x, y, from, _to) => {
          const line = musicGrid.controlLines.find(line => line.column === x)!;
          if (from === Color.Dark) {
            setLocation(getConfigurableLocation(grid, line.rows[y], line));
            setRef({
              current: (noteOverlayRef.current?.get(`${x}-${y}`) ?? undefined)!,
            });
          } else {
            const line = musicGrid.controlLines.find(line => line.column === x);
            if (!line) {
              setGrid(
                grid.replaceRule(
                  musicGrid,
                  musicGrid.setControlLine(
                    new ControlLine(
                      x,
                      null,
                      null,
                      false,
                      Array.from(
                        { length: grid.height },
                        () => new Row(null, null, null)
                      ).map((r, idx) =>
                        idx === y
                          ? r.copyWith({
                              note: 'C4',
                              instrument: null,
                              velocity: null,
                            })
                          : r
                      )
                    )
                  )
                )
              );
            } else {
              setGrid(
                grid.replaceRule(
                  musicGrid,
                  musicGrid.setControlLine(
                    line.copyWith({
                      rows: line.rows.map((r, idx) =>
                        idx === y ? new Row('C4', null, null) : r
                      ),
                    })
                  )
                )
              );
            }
          }
        }}
      />
      <GridOverlay>
        {musicGrid.controlLines
          .filter(line =>
            line.rows.some(r => r.note !== null || r.velocity !== null)
          )
          .flatMap(line =>
            line.rows.map(
              (row, idx) =>
                (row.note !== null || row.velocity !== null) && (
                  <div
                    ref={el => {
                      noteOverlayRef.current ??= new Map();
                      const map = noteOverlayRef.current;
                      map.set(`${line.column}-${idx}`, el);
                      return () => {
                        map.delete(`${line.column}-${idx}`);
                      };
                    }}
                    key={`${line.column}-${idx}`}
                    className="absolute h-[1em] w-[1em] bg-linear-to-r from-secondary from-5% via-20% via-secondary/20 to-secondary/0 edit-target"
                    style={{ left: `${line.column}em`, top: `${idx}em` }}
                  >
                    {row.note !== null && (
                      <div className="badge badge-secondary absolute left-[0.16em] top-[0.33em] text-[0.25em] h-[1.3em] pr-[0.4em] rounded-l-none rounded-r-[1em] whitespace-nowrap pl-0">
                        {row.note}
                      </div>
                    )}
                    {row.instrument !== null && (
                      <div className="badge badge-secondary absolute left-[0.33em] top-[3.4em] text-[0.13em] h-[1.3em] pr-[0.4em] rounded-l-none rounded-r-[1em] whitespace-nowrap pl-0">
                        {row.instrument}
                      </div>
                    )}
                    {row.velocity !== null && (
                      <div className="badge badge-secondary absolute left-[0.33em] top-[3.7em] text-[0.18em] h-[1.3em] pr-[0.4em] rounded-l-none rounded-r-[1em] whitespace-nowrap pl-0">
                        {row.velocity}
                      </div>
                    )}
                  </div>
                )
            )
          )}
      </GridOverlay>
    </>
  );
});

export default memo(function MusicNoteTool() {
  return (
    <ToolboxItem
      id="music_note"
      order={306}
      hotkey="extraSymbols-7"
      name="Music Note"
      description="Left click to place a note. Click again to configure it."
      gridOverlay={<NoteOverlay />}
      onTileClick={null}
    >
      <IoMusicalNote />
    </ToolboxItem>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.Toolbox,
  instructionId: musicGridInstance.id,
};

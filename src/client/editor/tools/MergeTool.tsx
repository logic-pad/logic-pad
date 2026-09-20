import { memo } from 'react';
import ToolboxItem from '../ToolboxItem';
import { Color } from '@logic-pad/core/data/primitives';
import { RiMergeCellsHorizontal } from 'react-icons/ri';
import { useAtomValue, useSetAtom } from 'jotai';
import { getGridAtom, setGridAtom } from '../../state/grid.ts';
import PointerCaptureOverlay from '../../grid/PointerCaptureOverlay';

function MergeToolOverlay() {
  const grid = useAtomValue(getGridAtom);
  const setGrid = useSetAtom(setGridAtom);
  return (
    <PointerCaptureOverlay
      width={grid.width}
      height={grid.height}
      step={0.01}
      colorMap={() => false}
      onTileClick={(x, y, from, to) => {
        if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
          return;
        }
        const tx = Math.floor(x);
        const ty = Math.floor(y);
        let cx, cy;
        if (Math.abs(tx + 0.5 - x) < 0.2 && Math.abs(ty + 0.5 - y) < 0.2)
          return;
        if (
          Math.abs(Math.round(x) - x) < 0.2 &&
          Math.abs(Math.round(y) - y) < 0.2
        )
          return;
        if (Math.abs(tx + 0.5 - x) > Math.abs(ty + 0.5 - y)) {
          cx = x > tx + 0.5 ? tx + 1 : tx - 1;
          cy = ty;
        } else {
          cx = tx;
          cy = y > ty + 0.5 ? ty + 1 : ty - 1;
        }
        if (tx < 0 || ty < 0 || cx < 0 || cy < 0) return;
        if (
          tx >= grid.width ||
          ty >= grid.height ||
          cx >= grid.width ||
          cy >= grid.height
        )
          return;
        const newEdge = { x1: tx, y1: ty, x2: cx, y2: cy };
        if (from === Color.Dark || to === Color.Dark) {
          if (!grid.connections.hasEdge(newEdge)) {
            setGrid(grid.withConnections(con => con.addEdge(newEdge)));
          }
        } else if (from === Color.Light || to === Color.Light) {
          if (grid.connections.hasEdge(newEdge)) {
            setGrid(grid.withConnections(con => con.removeEdge(newEdge)));
          }
        }
      }}
    />
  );
}

export default memo(function MergeTool() {
  return (
    <ToolboxItem
      id="merge"
      order={5}
      name="Merge tiles"
      description="Left click a gap to merge tiles. Right click to split tiles."
      hotkey="tools-4"
      gridOverlay={<MergeToolOverlay />}
      onTileClick={null}
    >
      <RiMergeCellsHorizontal />
    </ToolboxItem>
  );
});

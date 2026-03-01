import { memo } from 'react';
import ToolboxItem from '../ToolboxItem';
import { Color } from '@logic-pad/core/data/primitives';
import { RiEditBoxFill } from 'react-icons/ri';
import { GridConsumer } from '../../contexts/GridContext.tsx';
import PointerCaptureOverlay from '../../grid/PointerCaptureOverlay';

export default memo(function TileTool() {
  return (
    <ToolboxItem
      id="tile"
      order={2}
      name="Edit tile"
      description="Left click to set a tile as fixed. Right click to remove a tile."
      hotkey="tools-1"
      gridOverlay={
        <GridConsumer>
          {({ grid, setGrid }) => {
            return (
              <PointerCaptureOverlay
                width={grid.width}
                height={grid.height}
                colorMap={(x, y, color) => {
                  if (color === Color.Dark) return grid.getTile(x, y).fixed;
                  else if (color === Color.Light)
                    return !grid.getTile(x, y).exists;
                  return false;
                }}
                onTileClick={(x, y, from, to) => {
                  if (from === Color.Dark || to === Color.Dark) {
                    setGrid(
                      grid.copyWith({
                        tiles: grid.setTile(x, y, t =>
                          t.withFixed(to === Color.Dark)
                        ),
                      })
                    );
                  } else if (from === Color.Light || to === Color.Light) {
                    setGrid(
                      grid.copyWith({
                        tiles: grid.setTile(x, y, t =>
                          t.withExists(to !== Color.Light)
                        ),
                      })
                    );
                  }
                }}
              />
            );
          }}
        </GridConsumer>
      }
      onTileClick={null}
    >
      <RiEditBoxFill />
    </ToolboxItem>
  );
});

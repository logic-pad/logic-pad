import { Color } from '@logic-pad/core/data/primitives';
import { GridContext } from '../contexts/GridContext.tsx';

export default function handleTileClick(
  x: number,
  y: number,
  target: Color,
  flood: boolean,
  { grid, setGrid }: GridContext,
  overrideFixedTiles: boolean
) {
  if (overrideFixedTiles) {
    const tile = grid.getTile(x, y);
    if (flood && target === Color.Gray) {
      // target is Color.Gray if the tile is already the target color
      setGrid(grid.floodFillAll(Color.Gray, tile.color, true));
    } else if (flood) {
      setGrid(grid.floodFill({ x, y }, tile.color, target, true));
    } else {
      setGrid(
        grid.copyWith(
          { tiles: grid.setTile(x, y, t => t.withColor(target)) },
          false
        )
      );
    }
  } else {
    const tile = grid.getTile(x, y);
    if (flood && target === Color.Gray) {
      // target is Color.Gray if the tile is already the target color
      setGrid(grid.floodFillAll(Color.Gray, tile.color, false));
    } else if (flood && !tile.fixed) {
      setGrid(grid.floodFill({ x, y }, Color.Gray, target, false));
    } else if (!tile.fixed) {
      setGrid(
        grid.copyWith(
          { tiles: grid.setTile(x, y, t => t.withColor(target)) },
          false
        )
      );
    }
  }
}

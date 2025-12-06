import { memo, useEffect, useRef } from 'react';
import { useGrid } from '../contexts/GridContext';
import GridData from '@logic-pad/core/data/grid';
import * as Tone from 'tone';
import { Color, State } from '@logic-pad/core/data/primitives';
import { useGridState } from '../contexts/GridStateContext';
import { useSettings } from '../contexts/SettingsContext';

const sfx = {
  complete: new Tone.Player('/samples/sfx_complete.mp3').toDestination(),
  place: new Tone.Player('/samples/sfx_place.mp3').toDestination(),
  remove: new Tone.Player('/samples/sfx_remove.mp3').toDestination(),
};

export default memo(function GridSounds() {
  const { grid } = useGrid();
  const { state } = useGridState();
  const previousGrid = useRef<GridData | null>(null);
  const [sfxVolume] = useSettings('sfxVolume');
  useEffect(() => {
    sfx.complete.volume.value = Tone.gainToDb(sfxVolume);
    sfx.place.volume.value = Tone.gainToDb(sfxVolume);
    sfx.remove.volume.value = Tone.gainToDb(sfxVolume);
  }, [sfxVolume]);
  useEffect(() => {
    if (
      sfxVolume > 0 &&
      previousGrid.current &&
      !previousGrid.current.colorEquals(grid) &&
      previousGrid.current.width === grid.width &&
      previousGrid.current.height === grid.height &&
      !grid.musicGrid.value
    ) {
      let placedTiles = 0;
      let removedTiles = 0;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const prevColor = previousGrid.current.getTile(x, y)?.color || null;
          const newColor = grid.getTile(x, y)?.color || null;
          if (prevColor === null || newColor === null) continue;
          if (prevColor !== Color.Gray && newColor === Color.Gray) {
            removedTiles++;
          } else if (prevColor !== newColor) {
            placedTiles++;
          }
        }
      }
      if (placedTiles > 0 && removedTiles === 0) {
        sfx.place.stop();
        sfx.place.start();
      } else if (removedTiles > 0 && placedTiles === 0) {
        sfx.remove.stop();
        sfx.remove.start();
      }
    }
    previousGrid.current = grid;
  }, [grid, sfxVolume]);
  useEffect(() => {
    if (sfxVolume > 0 && State.isSatisfied(state.final)) {
      sfx.complete.stop();
      sfx.complete.start();
    }
  }, [state.final, sfxVolume]);
  return null;
});

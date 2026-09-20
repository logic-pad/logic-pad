import { memo } from 'react';
import MainGrid from '../grid/MainGrid';
import RulerOverlay from '../grid/RulerOverlay';
import ToolboxOverlay from './ToolboxOverlay';
import { useAtomValue } from 'jotai';
import { getGridAtom } from '../state/grid.ts';

export default memo(function EditorMainGrid() {
  const grid = useAtomValue(getGridAtom);
  return (
    <MainGrid useToolboxClick={true} key="Grid" allowAnimation={false}>
      <RulerOverlay width={grid.width} height={grid.height} />
      <ToolboxOverlay />
    </MainGrid>
  );
});

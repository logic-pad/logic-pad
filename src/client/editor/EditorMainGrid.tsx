import { memo } from 'react';
import MainGrid from '../grid/MainGrid';
import { GridConsumer } from '../contexts/GridContext';
import RulerOverlay from '../grid/RulerOverlay';
import ToolboxOverlay from './ToolboxOverlay';

export default memo(function EditorMainGrid() {
  return (
    <MainGrid useToolboxClick={true} key="Grid" allowAnimation={false}>
      <GridConsumer>
        {({ grid }) => <RulerOverlay width={grid.width} height={grid.height} />}
      </GridConsumer>
      <ToolboxOverlay />
    </MainGrid>
  );
});

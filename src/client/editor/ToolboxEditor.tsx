import { memo } from 'react';
import { useToolbox } from '../contexts/ToolboxContext.tsx';
import { allTools } from './tools';
import { cn } from '../../client/uiHelper.ts';
import GridSizeEditor from './GridSizeEditor';
import { GridConsumer } from '../contexts/GridContext.tsx';
import InstructionPartOutlet from '../instructions/InstructionPartOutlet';
import { PartPlacement } from '../instructions/parts/types';
import { useSettings } from '../contexts/SettingsContext.tsx';
import PresetsEditor from './PresetsEditor.tsx';

export default memo(function ToolboxEditor() {
  const { name, description } = useToolbox();
  const [showMoreTools, setShowMoreTools] = useSettings('showMoreTools');

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="bg-base-100 text-base-content rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
        <GridConsumer>
          {({ grid, setGrid }) => (
            <GridSizeEditor grid={grid} setGrid={setGrid} />
          )}
        </GridConsumer>
        <span className="divider mt-0 mb-0"></span>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">
            {name ?? 'No tool selected'}
          </span>
          <span
            className={cn(
              'inline-block text-sm h-0 transition-[height]',
              description && 'h-[3.5em]'
            )}
          >
            {description}
          </span>
        </div>
        <span className="divider mt-0 mb-0"></span>
        <div className="flex flex-wrap gap-2 justify-center tour-tools">
          {allTools.map((Tool, i) => (
            <Tool key={i} />
          ))}
          <GridConsumer>
            {({ grid }) => (
              <InstructionPartOutlet
                grid={grid}
                placement={PartPlacement.Toolbox}
              />
            )}
          </GridConsumer>
        </div>
        <button
          type="button"
          className="btn btn-sm w-fit self-center"
          onClick={() => setShowMoreTools(!showMoreTools)}
        >
          {showMoreTools ? 'Show less' : 'Show more'}
        </button>
        <span className="divider mt-0 mb-0"></span>
        <PresetsEditor />
      </div>
    </div>
  );
});

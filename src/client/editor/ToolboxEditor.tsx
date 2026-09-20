import { memo } from 'react';
import { toolDescriptionAtom, toolNameAtom } from '../state/toolbox.ts';
import { allTools } from './tools';
import { cn } from '../../client/uiHelper.ts';
import GridSizeEditor from './GridSizeEditor';
import { useAtomValue, useSetAtom } from 'jotai';
import { getGridAtom, setGridAtom } from '../state/grid.ts';
import InstructionPartOutlet from '../instructions/InstructionPartOutlet';
import { PartPlacement } from '../instructions/parts/types';
import { useSettings } from '../state/settings.ts';
import PresetsEditor from './PresetsEditor.tsx';

export default memo(function ToolboxEditor() {
  const name = useAtomValue(toolNameAtom);
  const description = useAtomValue(toolDescriptionAtom);
  const [showMoreTools, setShowMoreTools] = useSettings('showMoreTools');
  const grid = useAtomValue(getGridAtom);
  const setGrid = useSetAtom(setGridAtom);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="bg-base-100 text-base-content rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
        <GridSizeEditor grid={grid} setGrid={setGrid} />
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
          <InstructionPartOutlet
            grid={grid}
            placement={PartPlacement.Toolbox}
          />
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

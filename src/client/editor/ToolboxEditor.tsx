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
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
} from 'react-icons/fa';
import { tip } from '../components/Tooltip.tsx';

export interface ToolboxEditorProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CollapseButton = memo(function CollapseButton({
  collapsed,
  onToggleCollapse,
}: Required<ToolboxEditorProps>) {
  return (
    <div
      {...tip(collapsed ? 'Expand toolbox' : 'Collapse toolbox', 'right')}
      className="w-fit shrink-0"
    >
      <button
        type="button"
        className="btn btn-sm btn-ghost btn-square"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand toolbox' : 'Collapse toolbox'}
      >
        {collapsed ? (
          <>
            <FaChevronRight className="hidden lg:block" />
            <FaChevronDown className="lg:hidden" />
          </>
        ) : (
          <>
            <FaChevronLeft className="hidden lg:block" />
            <FaChevronUp className="lg:hidden" />
          </>
        )}
      </button>
    </div>
  );
});

export default memo(function ToolboxEditor({
  collapsed,
  onToggleCollapse,
}: ToolboxEditorProps) {
  const name = useAtomValue(toolNameAtom);
  const description = useAtomValue(toolDescriptionAtom);
  const [showMoreTools, setShowMoreTools] = useSettings('showMoreTools');
  const grid = useAtomValue(getGridAtom);
  const setGrid = useSetAtom(setGridAtom);

  if (collapsed) {
    return (
      <div className="flex lg:flex-col items-center gap-2 p-2 bg-base-100 text-base-content rounded-xl m-2 w-fit">
        <CollapseButton collapsed={true} onToggleCollapse={onToggleCollapse!} />
        <div className="flex lg:flex-col gap-8 items-center overflow-x-auto overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto">
          <div className="flex lg:flex-col gap-2 items-center tour-tools">
            {allTools.map((Tool, i) => (
              <Tool key={i} />
            ))}
          </div>
          <PresetsEditor collapsed={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="bg-base-100 text-base-content rounded-xl p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <CollapseButton
            collapsed={false}
            onToggleCollapse={onToggleCollapse!}
          />
          <GridSizeEditor grid={grid} setGrid={setGrid} />
        </div>
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

import { memo, useMemo } from 'react';
import { Presets, presetsAtom, toolIdAtom } from '../state/toolbox.ts';
import { useAtom, useAtomValue } from 'jotai';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { allSymbols } from '../symbols';
import SymbolTool from './SymbolTool';
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ToolboxHotkey } from './ToolboxItem';
import { tip } from '../components/Tooltip.tsx';

interface SortablePreset {
  id: string;
  preset: Presets[number];
}

const PresetTool = memo(function PresetTool({
  id,
  preset,
  order,
}: SortablePreset & { order: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <SymbolTool
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="touch-none"
      key={id}
      name={preset.name}
      id={id}
      hotkey={`customSymbols-${order}` as ToolboxHotkey}
      sample={preset.symbol}
      component={allSymbols.get(preset.symbol.id)!.component}
    />
  );
});

export default memo(function PresetsEditor() {
  const toolId = useAtomValue(toolIdAtom);
  const [presets, setPresets] = useAtom(presetsAtom);

  const sortablePresets = useMemo<SortablePreset[]>(
    () =>
      presets.map(preset => ({
        id: preset.symbol.id + '_' + preset.name,
        preset,
      })),
    [presets]
  );

  const selectedPreset = sortablePresets.find(preset => preset.id === toolId);

  const presetTools = sortablePresets.map(({ id, preset }, idx) => (
    <PresetTool key={id} id={id} preset={preset} order={idx} />
  ));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <>
      <div className="flex gap-4 justify-between items-center pr-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">Presets</span>
          <span className="text-sm">
            Quickly place identical symbols with presets.
          </span>
        </div>
        <div {...tip('Remove selected preset', 'left')}>
          <button
            type="button"
            aria-label="Remove selected preset"
            className="btn btn-square"
            disabled={!selectedPreset}
            onClick={() =>
              setPresets(
                sortablePresets
                  .filter(x => x.id !== selectedPreset?.id)
                  .map(x => x.preset)
              )
            }
          >
            <RiDeleteBin6Line />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {presetTools.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={e => {
              const { active, over } = e;

              if (over && active.id !== over.id) {
                setPresets(
                  arrayMove(
                    presets.slice(),
                    sortablePresets.map(r => r.id).indexOf(active.id as string),
                    sortablePresets.map(r => r.id).indexOf(over.id as string)
                  )
                );
              }
            }}
          >
            <SortableContext
              items={sortablePresets}
              strategy={rectSortingStrategy}
            >
              {presetTools}
            </SortableContext>
          </DndContext>
        ) : (
          <span className="text-xs opacity-70 p-4">No presets saved.</span>
        )}
      </div>
    </>
  );
});

import { memo, useEffect, useRef } from 'react';
import { cn } from '../../client/uiHelper.ts';
import GridData from '@logic-pad/core/data/grid';

export interface GridSizeEditorProps {
  grid: GridData;
  setGrid: (grid: GridData) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

function getButtonSize(size: GridSizeEditorProps['size']) {
  switch (size) {
    case 'xs':
      return 'btn-xs';
    case 'sm':
      return 'btn-sm';
    case 'md':
      return '';
    case 'lg':
      return 'btn-lg';
  }
}

function getInputSize(size: GridSizeEditorProps['size']) {
  switch (size) {
    case 'xs':
      return 'input-xs';
    case 'sm':
      return 'input-sm';
    case 'md':
      return '';
    case 'lg':
      return 'input-lg';
  }
}

export default memo(function GridSizeEditor({
  grid,
  setGrid,
  size,
}: GridSizeEditorProps) {
  size = size ?? 'md';
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (widthRef.current) widthRef.current.value = grid.width.toString();
    if (heightRef.current) heightRef.current.value = grid.height.toString();
  }, [grid]);

  return (
    <div className="flex flex-col gap-2 tour-grid-size-editor">
      <div className="flex gap-2">
        <fieldset className="fieldset w-full max-w-xs">
          <div className="label">
            <span className="label-text text-sm">Width</span>
          </div>
          <input
            ref={widthRef}
            type="number"
            min="0"
            step={1}
            defaultValue={grid.width}
            className={cn('input w-full max-w-xs min-w-0', getInputSize(size))}
          />
        </fieldset>
        <fieldset className="fieldset w-full max-w-xs">
          <div className="label">
            <span className="label-text text-sm">Height</span>
          </div>
          <input
            ref={heightRef}
            type="number"
            min="0"
            step={1}
            defaultValue={grid.height}
            className={cn('input w-full max-w-xs min-w-0', getInputSize(size))}
          />
        </fieldset>
      </div>
      <button
        type="button"
        className={cn('btn btn-outline btn-info', getButtonSize(size))}
        onClick={() => {
          if (
            widthRef.current?.reportValidity() &&
            heightRef.current?.reportValidity()
          ) {
            setGrid(
              grid.resize(
                widthRef.current?.valueAsNumber ?? 0,
                heightRef.current?.valueAsNumber ?? 0
              )
            );
          }
        }}
      >
        Resize
      </button>
    </div>
  );
});

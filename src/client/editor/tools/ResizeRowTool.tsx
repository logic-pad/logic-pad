import React, { memo, useState } from 'react';
import ToolboxItem from '../ToolboxItem';
import { useGrid } from '../../contexts/GridContext';
import { IoMdAdd, IoMdRemove } from 'react-icons/io';
import { TbRowInsertTop } from 'react-icons/tb';

interface ResizeAction {
  type: 'insert' | 'remove';
  direction: 'row' | 'column';
  index: number;
}

export interface ResizeToolOverlayProps {
  direction: 'row' | 'column';
}

export function ResizeToolOverlay({ direction }: ResizeToolOverlayProps) {
  const { grid, setGrid } = useGrid();
  const [action, setAction] = useState<ResizeAction | null>(null);

  const getPointerLocation = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * grid.width;
    const y = ((e.clientY - rect.top) / rect.height) * grid.height;
    return { x, y };
  };

  return (
    <>
      <div
        className="absolute inset-0"
        onPointerUp={() => {
          if (action) {
            if (action.type === 'insert') {
              if (action.direction === 'row') {
                setGrid(grid.insertRow(action.index));
              } else {
                setGrid(grid.insertColumn(action.index));
              }
            } else if (action.type === 'remove') {
              if (action.direction === 'row') {
                setGrid(grid.removeRow(action.index));
              } else {
                setGrid(grid.removeColumn(action.index));
              }
            }
            setAction(null);
          }
        }}
        onPointerMove={e => {
          let { x, y } = getPointerLocation(e);
          x = Math.floor((x - 0.25) / 0.5) * 0.5;
          y = Math.floor((y - 0.25) / 0.5) * 0.5;
          const index = direction === 'column' ? Math.ceil(x) : Math.ceil(y);
          const isRemove =
            direction === 'column' ? x === Math.floor(x) : y === Math.floor(y);
          const newAction = {
            type: isRemove ? 'remove' : 'insert',
            direction,
            index,
          } as const;
          setAction(oldAction => {
            if (
              oldAction &&
              oldAction.type === newAction.type &&
              oldAction.direction === newAction.direction &&
              oldAction.index === newAction.index
            ) {
              return oldAction;
            }
            return newAction;
          });
        }}
        onPointerLeave={() => setAction(null)}
      >
        {action &&
          (action.type === 'insert' ? (
            action.direction === 'row' ? (
              <div
                className="absolute h-[0.1em] w-full left-0 bg-info rounded-full pointer-events-none"
                style={{ top: `${action.index - 0.05}em` }}
              >
                <div className="absolute right-[calc(100%-0.1em)] w-[0.2em] h-[0.2em] rounded-full bg-info text-info-content flex items-center justify-center -top-[0.05em]">
                  <IoMdAdd />
                </div>
              </div>
            ) : (
              <div
                className="absolute w-[0.1em] h-full left-0 bg-info rounded-full pointer-events-none"
                style={{ left: `${action.index - 0.05}em` }}
              >
                <div className="absolute bottom-[calc(100%-0.1em)] w-[0.2em] h-[0.2em] rounded-full bg-info text-info-content flex items-center justify-center -left-[0.05em]">
                  <IoMdAdd />
                </div>
              </div>
            )
          ) : action.direction === 'row' ? (
            <div
              className="absolute h-[1em] w-full left-0 bg-error/50 rounded-[0.1em] pointer-events-none"
              style={{ top: `${action.index}em` }}
            >
              <div className="absolute right-[calc(100%-0.1em)] w-[0.2em] h-[0.2em] rounded-full bg-error text-error-content flex items-center justify-center -top-[0.05em]">
                <IoMdRemove />
              </div>
            </div>
          ) : (
            <div
              className="absolute w-[1em] h-full left-0 bg-error/50 rounded-[0.1em] pointer-events-none"
              style={{ left: `${action.index}em` }}
            >
              <div className="absolute bottom-[calc(100%-0.1em)] w-[0.2em] h-[0.2em] rounded-full bg-error text-error-content flex items-center justify-center -left-[0.05em]">
                <IoMdRemove />
              </div>
            </div>
          ))}
      </div>
    </>
  );
}

export default memo(function ResizeRowTool() {
  return (
    <ToolboxItem
      id="resize_row"
      order={3}
      name="Resize row"
      description="Click between tiles to insert. Click on tiles to remove."
      hotkey="tools-2"
      gridOverlay={<ResizeToolOverlay direction="row" />}
      onTileClick={null}
    >
      <TbRowInsertTop />
    </ToolboxItem>
  );
});

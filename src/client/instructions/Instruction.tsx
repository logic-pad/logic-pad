import React, { memo, useMemo } from 'react';
import InstructionData from '@logic-pad/core/data/instruction';
import { State } from '@logic-pad/core/data/primitives';
import { cn } from '../../client/uiHelper.ts';
import Grid from '../grid/Grid';
import SymbolOverlay from '../grid/SymbolOverlay';
import AnnotatedText from '../components/AnnotatedText';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PartPlacement } from './parts/types.ts';
import InstructionPartOutlet from './InstructionPartOutlet.tsx';
import GridZoneOverlay from '../grid/GridZoneOverlay.tsx';
import { useMediaQuery } from 'react-responsive';

export interface InstructionProps {
  id: string | number;
  editable: boolean;
  instruction: InstructionData;
  state?: State;
  children?: React.ReactNode;
  className?: string;
  size?: 'responsive' | 'lg' | 'sm';
}

function instructionBg(state: State) {
  switch (state) {
    case State.Satisfied:
      return cn('bg-linear-to-r from-success/50 via-primary/10 to-primary/10');
    case State.Error:
      return cn('bg-linear-to-r from-error/50 via-primary/10 to-primary/10');
    default:
      return cn('bg-primary/10');
  }
}

export default memo(function Instruction({
  id,
  editable,
  instruction,
  state,
  children,
  className,
  size,
}: InstructionProps) {
  state = state ?? State.Incomplete;
  size = size ?? 'responsive';
  const exampleGrid = useMemo(
    () => instruction.createExampleGrid(),
    [instruction]
  );
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const isLargeMedia = useMediaQuery({ minWidth: 1024 });
  const isLargeScreen =
    size === 'lg' || (size === 'responsive' && isLargeMedia);
  const responsive = size === 'responsive';
  const large = size === 'lg';

  return (
    <div
      ref={editable ? setNodeRef : null}
      style={
        editable
          ? {
              transform: CSS.Transform.toString(transform),
              transition,
            }
          : {}
      }
      {...(editable ? attributes : {})}
      {...(editable ? listeners : {})}
      className={cn(
        'flex flex-col w-[320px] items-stretch shrink-0',
        editable && 'touch-none',
        className
      )}
    >
      <div
        className={cn(
          'relative flex flex-1 m-0 border-0 pr-2',
          instructionBg(state)
        )}
      >
        <div
          className={cn(
            'w-1 shrink-0 grow-0 transition-colors',
            state === State.Incomplete
              ? 'bg-opacity-0'
              : state === State.Satisfied
                ? 'bg-success'
                : state === State.Ignored
                  ? 'bg-neutral opacity-60'
                  : 'bg-error'
          )}
        ></div>
        <div
          className={cn(
            'text-center py-1 px-2 flex grow justify-center items-center text-neutral-content',
            responsive
              ? 'text-sm lg:text-base'
              : large
                ? 'text-base'
                : 'text-sm'
          )}
        >
          <AnnotatedText>{instruction.explanation}</AnnotatedText>
        </div>
        <div
          className={cn(
            'shrink-0 relative flex items-center justify-center py-1',
            responsive
              ? 'min-h-[calc(16px*4)] lg:min-h-[calc(30px*4)] min-w-[calc(16px*5)] lg:min-w-[calc(30px*5)]'
              : large
                ? 'min-h-[calc(30px*4)] min-w-[calc(30px*5)]'
                : 'min-h-[calc(16px*4)] min-w-[calc(16px*5)]'
          )}
        >
          {exampleGrid && (
            <Grid
              type="canvas"
              size={
                (exampleGrid.width === 1 && exampleGrid.height === 1
                  ? 56
                  : 28) / (isLargeScreen ? 1 : 2) // special case for rules with a single symbol as thumbnail
              }
              grid={exampleGrid}
              editable={false}
            >
              {exampleGrid.symbols.size > 0 ? (
                <SymbolOverlay
                  grid={exampleGrid}
                  solution={null}
                  editable={false}
                />
              ) : null}
              <InstructionPartOutlet
                grid={exampleGrid}
                placement={PartPlacement.GridOverlay}
              />
              <GridZoneOverlay grid={exampleGrid} />
            </Grid>
          )}
        </div>
        {children}
      </div>
      <div className="h-px bg-accent"></div>
    </div>
  );
});

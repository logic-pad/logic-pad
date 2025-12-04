import { memo, ReactNode, useMemo } from 'react';
import { PuzzleBrief, ResourceStatus } from './data';
import {
  FaCheckSquare,
  FaEyeSlash,
  FaHeart,
  FaListOl,
  FaMusic,
} from 'react-icons/fa';
import { PiCheckerboardFill } from 'react-icons/pi';
import { TbLayoutGridRemove, TbLayoutGrid } from 'react-icons/tb';
import { type PuzzleType } from '@logic-pad/core/data/primitives';
import { BsQuestionSquare } from 'react-icons/bs';
import Difficulty from '../metadata/Difficulty';
import { cn } from '../uiHelper';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, LinkComponentProps } from '@tanstack/react-router';
import SupporterBadge from '../components/SupporterBadge';

type PuzzleTypeString = `${PuzzleType}`;

export interface PuzzleCardProps extends Partial<LinkComponentProps> {
  puzzle: PuzzleBrief;
  expandable?: boolean;
  dragDroppable?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

function getIconForType(type: PuzzleTypeString) {
  switch (type) {
    case 'music':
      return FaMusic;
    case 'pattern':
      return PiCheckerboardFill;
    case 'underclued':
      return TbLayoutGridRemove;
    case 'logic':
      return TbLayoutGrid;
  }
}

export const PuzzleIcon = memo(function PuzzleIcon({
  types,
  className,
  size,
}: {
  types: PuzzleTypeString[];
  className?: string;
  size: number;
}) {
  if (types.includes('underclued')) {
    // "Logic" tag is added for searching in underclued puzzles, no need to display both
    types = types.filter(type => type !== 'logic');
  }
  const styles = useMemo(
    () => ({
      width: size,
      height: size,
    }),
    [size]
  );
  if (types.length === 0) {
    return <BsQuestionSquare size={size} className={className} />;
  } else if (types.length === 1) {
    const Icon = getIconForType(types[0]);
    return <Icon size={size} className={className} />;
  } else if (types.length === 2) {
    const Icon1 = getIconForType(types[0]);
    const Icon2 = getIconForType(types[1]);
    return (
      <div
        style={styles}
        className={cn(
          'relative bg-base-300 [.wrapper:hover_&]:bg-base-100 text-base-content transition-colors',
          className
        )}
      >
        <Icon1
          size={(size / 3) * 2}
          className="absolute top-0 left-0 bg-inherit"
        />
        <Icon2
          size={(size / 3) * 2}
          className="absolute bottom-0 right-0 bg-inherit"
        />
      </div>
    );
  } else if (types.length === 3) {
    const Icon1 = getIconForType(types[0]);
    const Icon2 = getIconForType(types[1]);
    const Icon3 = getIconForType(types[2]);
    return (
      <div
        style={styles}
        className={cn(
          'relative bg-base-300 [.wrapper:hover_&]:bg-base-100 text-base-content transition-colors',
          className
        )}
      >
        <Icon1 size={size / 2} className="absolute top-0 left-0 bg-inherit" />
        <Icon2
          size={size / 2}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-inherit"
        />
        <Icon3 size={size / 2} className="absolute top-0 right-0 bg-inherit" />
      </div>
    );
  } else if (types.length >= 4) {
    const Icon1 = getIconForType(types[0]);
    const Icon2 = getIconForType(types[1]);
    const Icon3 = getIconForType(types[2]);
    const Icon4 = getIconForType(types[3]);
    return (
      <div
        style={styles}
        className={cn(
          'relative bg-base-300 [.wrapper:hover_&]:bg-base-100 text-base-content transition-colors',
          className
        )}
      >
        <Icon1 size={size / 2} className="absolute top-0 left-0 bg-inherit" />
        <Icon2 size={size / 2} className="absolute top-0 right-0 bg-inherit" />
        <Icon3
          size={size / 2}
          className="absolute bottom-0 left-0 bg-inherit"
        />
        <Icon4
          size={size / 2}
          className="absolute bottom-0 right-0 bg-inherit"
        />
      </div>
    );
  }
});

export default memo(function PuzzleCard({
  puzzle,
  expandable = true,
  dragDroppable = false,
  children,
  ...props
}: PuzzleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: puzzle.id });
  const RootComponent = props.to ? Link : 'a';
  return (
    <div
      ref={dragDroppable ? setNodeRef : null}
      style={
        dragDroppable
          ? {
              transform: CSS.Transform.toString(transform),
              transition,
            }
          : {}
      }
      {...(dragDroppable ? attributes : {})}
      {...(dragDroppable ? listeners : {})}
      className={cn(
        'w-[320px] h-[116px] [:hover]:z-50 shrink-0 grow-0',
        dragDroppable && 'touch-none'
      )}
    >
      <RootComponent
        preload={false}
        className={cn(
          'relative w-full h-full [:hover]:h-fit flex gap-4 items-center px-4 py-2 rounded-xl shadow-md wrapper [:hover]:shadow-xl [:hover]:outline-2 -outline-offset-2 outline-accent transition-all text-base-content',
          puzzle.status === ResourceStatus.Private
            ? `bg-base-300/50 [:hover]:bg-base-100`
            : 'bg-base-300 [:hover]:bg-base-100',
          isDragging && 'pointer-events-none'
        )}
        role="button"
        aria-label={`${puzzle.title} by ${puzzle.creator.name}; Types ${puzzle.types.join(', ')}; Difficulty ${puzzle.designDifficulty};  Size ${puzzle.width} by ${puzzle.height};  ${puzzle.solveCount} solves,  ${puzzle.loveCount} loves`}
        {...props}
      >
        <PuzzleIcon
          types={puzzle.types}
          size={36}
          className="shrink-0"
          aria-hidden="true"
        />
        <div className="flex flex-col" aria-hidden="true">
          <h2
            className={cn(
              'text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis',
              expandable &&
                '[.wrapper:hover_&]:whitespace-normal [.wrapper:hover_&]:wrap-break-word'
            )}
          >
            {puzzle.inSeries && (
              <FaListOl size={14} className="inline text-accent" />
            )}{' '}
            {puzzle.title.length === 0 ? 'Untitled Puzzle' : puzzle.title}
          </h2>
          <div className="badge badge-neutral bg-neutral/20 text-base-content badge-md mt-1">
            {puzzle.creator.name}
            <SupporterBadge supporter={puzzle.creator.supporter} />
          </div>
          <div className="flex gap-2 mt-2 text-sm">
            {puzzle.width} &times; {puzzle.height}
            <Difficulty value={puzzle.designDifficulty} size="xs" />
          </div>
          {puzzle.status === ResourceStatus.Public ? (
            <div className="flex gap-4 text-sm opacity-80">
              <span className="flex items-center">
                <FaCheckSquare className="me-2" /> {puzzle.solveCount}
                <span className="hidden [.wrapper:hover_&]:inline-block ms-1">
                  {puzzle.solveCount === 1 ? 'solve' : 'solves'}
                </span>
              </span>
              <span className="flex items-center">
                <FaHeart className="me-2" /> {puzzle.loveCount}
                <span className="hidden [.wrapper:hover_&]:inline-block ms-1">
                  {puzzle.loveCount === 1 ? 'love' : 'loves'}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex gap-4 text-sm opacity-80">
              <span className="flex items-center">
                <FaEyeSlash className="me-2" />
                Private
              </span>
            </div>
          )}
        </div>
        {children}
      </RootComponent>
    </div>
  );
});

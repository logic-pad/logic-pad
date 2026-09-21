import { memo, PropsWithChildren } from 'react';
import { cn } from '../uiHelper.ts';

export interface PuzzleSurfaceProps extends PropsWithChildren {
  className?: string;
}

/**
 * Raised, neutral-colored container that visually separates puzzle-specific UI
 * (grids, instructions, puzzle controls) from the generic base-colored UI
 * around it. The neutral background guarantees contrast for black/white
 * puzzle tiles regardless of the active theme.
 */
export default memo(function PuzzleSurface({
  className,
  children,
}: PuzzleSurfaceProps) {
  return (
    <div
      className={cn(
        'bg-neutral text-neutral-content rounded-xl shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
});

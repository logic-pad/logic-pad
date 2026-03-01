import React, { memo, Ref } from 'react';
import { cn } from '../../client/uiHelper.ts';

export interface GridOverlayProps {
  className?: string;
  children?: React.ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export default memo(function GridOverlay({
  children,
  className,
  ref,
}: GridOverlayProps) {
  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 pointer-events-none', className)}
    >
      {children}
    </div>
  );
});

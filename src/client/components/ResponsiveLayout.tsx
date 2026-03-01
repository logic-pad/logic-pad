import React, { memo } from 'react';
import { cn } from '../uiHelper';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default memo(function ResponsiveLayout({
  children,
  footer,
  className,
}: ResponsiveLayoutProps) {
  return (
    <div className="flex flex-col flex-1 self-center items-center w-full overflow-y-auto">
      <div
        className={cn(
          'flex flex-col w-full max-w-[calc(320px*3+1rem*2+1rem*2)] md:max-w-[calc(320px*3+1rem*2+3rem*2)] gap-4 mb-16 px-4 md:px-12 shrink-0',
          className
        )}
      >
        {children}
      </div>
      <div className="flex-1 shrink" />
      {footer}
    </div>
  );
});

import React, { memo } from 'react';
import { cn } from '../uiHelper';

export interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default memo(function Accordion({
  title,
  children,
  className,
}: AccordionProps) {
  return (
    <div
      className={cn(
        `collapse collapse-arrow shrink-0 bg-base-100 text-base-content`,
        className
      )}
    >
      <input
        type="checkbox"
        name="gui-editor-accordion"
        defaultChecked={true}
      />
      <div className="collapse-title font-medium">{title}</div>
      <div className="collapse-content">{children}</div>
    </div>
  );
});

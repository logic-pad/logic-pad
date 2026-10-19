import { AnyConfig } from '@logic-pad/core/data/config';
import React, { memo, useState } from 'react';
import { cn } from '../../uiHelper';
import { FaChevronUp, FaInfoCircle } from 'react-icons/fa';
import { useActiveLocale } from '../../router/useLocale.ts';

export interface ConfigItemProps {
  config: AnyConfig;
  children?: React.ReactNode;
}

export default memo(function ConfigItem({ config, children }: ConfigItemProps) {
  // `description`/`explanation` originate in @logic-pad/core, so they are
  // outside lingui's provider: subscribe explicitly to re-render on switch.
  useActiveLocale();
  const [showExplanation, setShowExplanation] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex p-2 gap-1 justify-between items-center">
        <button
          type="button"
          className={cn(
            'btn btn-sm btn-ghost',
            !config.explanation && 'pointer-events-none'
          )}
          onClick={() => setShowExplanation(!showExplanation)}
        >
          {config.description}
          {config.explanation &&
            (showExplanation ? <FaChevronUp /> : <FaInfoCircle />)}
        </button>
        {children}
      </div>
      {showExplanation && config.explanation && (
        <div className="px-4 pb-2 text-sm opacity-80">{config.explanation}</div>
      )}
    </div>
  );
});

export const type = undefined;

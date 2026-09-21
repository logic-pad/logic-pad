import { memo } from 'react';
import { BiSolidFlagCheckered } from 'react-icons/bi';
import { cn } from '../../client/uiHelper.ts';
import { RiRobot2Fill } from 'react-icons/ri';
import { tip } from './Tooltip.tsx';

export interface SupportLevelProps {
  validate?: boolean;
  solve?: boolean;
}

export default memo(function SupportLevel({
  validate,
  solve,
}: SupportLevelProps) {
  return (
    <div className="flex items-center rounded-box border-2 border-base-100 px-4 gap-2">
      <span className="text-xs opacity-70">Support:</span>
      {validate !== undefined && (
        <div
          {...tip(
            validate
              ? 'Validates solution automatically'
              : 'Only checks against provided solution'
          )}
        >
          <BiSolidFlagCheckered
            size={22}
            className={cn(validate ? 'text-success' : 'text-error')}
          />
        </div>
      )}
      {solve !== undefined && (
        <div
          {...tip(solve ? 'Supported by solver' : 'Not supported by solver')}
        >
          <RiRobot2Fill
            size={22}
            className={cn(solve ? 'text-success' : 'text-error')}
          />
        </div>
      )}
    </div>
  );
});

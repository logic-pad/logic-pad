import { memo } from 'react';
import { IoIosEye } from 'react-icons/io';
import { IoBan, IoClose } from 'react-icons/io5';
import { cn } from '../../uiHelper';
import { Status, statusToText } from './insightHelper';

export default memo(function InsightHeader({
  status,
  coolingDown,
  cooldownProgress,
  solveProgress,
  progressLabel,
  onAction,
}: {
  status: Status;
  coolingDown: boolean;
  cooldownProgress: number;
  solveProgress: number;
  progressLabel: string | null;
  onAction: () => void;
}) {
  const panelOpen = status !== null;
  const barValue = !panelOpen
    ? cooldownProgress * 100
    : status === 'solving'
      ? solveProgress
      : 100;
  const barColor =
    !panelOpen || status === 'solving'
      ? 'progress-primary'
      : status === 'found' || status === 'revealed'
        ? 'progress-success'
        : 'progress-error';
  const label = statusToText(status, coolingDown);
  return (
    <>
      <div className="flex flex-row-reverse items-center gap-2">
        <button
          type="button"
          className={cn(
            'btn btn-ghost text-lg w-fit',
            coolingDown && 'pointer-events-none'
          )}
          disabled={coolingDown}
          aria-label={label}
          onClick={onAction}
        >
          {status === 'solving' ? (
            <IoBan size={28} />
          ) : panelOpen ? (
            <IoClose size={28} />
          ) : (
            <IoIosEye size={28} />
          )}
        </button>
        <div
          className={cn(
            !panelOpen && 'group-hover:opacity-100 opacity-0 transition-opacity'
          )}
        >
          {label}
          {status === 'solving' && progressLabel && (
            <span className="text-xs opacity-60 ml-2 whitespace-nowrap">
              {progressLabel}
            </span>
          )}
        </div>
      </div>
      <progress
        className={cn(
          'progress h-[4px]',
          barColor,
          !panelOpen && 'group-hover:opacity-100 opacity-0 transition-opacity'
        )}
        value={barValue}
        max="100"
      ></progress>
    </>
  );
});

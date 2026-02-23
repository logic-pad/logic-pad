import { memo, useMemo } from 'react';
import Difficulty, { medianFromHistogram } from '../metadata/Difficulty';
import { cn } from '../uiHelper';
import './ratedDifficulty.css';

export interface RatedDifficultyProps {
  collapsible?: boolean;
  ratedDifficulty: number[];
  className?: string;
}

export default memo(function RatedDifficulty({
  collapsible = false,
  ratedDifficulty,
  className,
}: RatedDifficultyProps) {
  const median = useMemo(
    () => medianFromHistogram(ratedDifficulty),
    [ratedDifficulty]
  );
  const max = useMemo(() => Math.max(...ratedDifficulty), [ratedDifficulty]);

  return (
    <div
      className={cn(
        'collapse collapse-arrow shrink-0 rounded-none',
        !collapsible && 'collapse-open',
        className
      )}
    >
      <input
        type="checkbox"
        name="gui-editor-accordion"
        aria-label="Toggle rated difficulty details"
        defaultChecked={!collapsible}
      />
      <div
        className={cn(
          'collapse-title font-medium flex gap-2 items-center p-0 min-h-0 after:top-3!',
          !collapsible && 'after:hidden!'
        )}
      >
        Rated difficulty:{' '}
        <Difficulty className="flex items-center" value={median} />
      </div>
      <div className="collapse-content p-0!">
        {median === 0 ? (
          <div className="opacity-50 my-4">No ratings yet</div>
        ) : (
          <div className="grid grid-cols-10 grid-rows-[minmax(0,1fr)_min-content] gap-1 my-4 w-[250px] h-32 items-end justify-items-center">
            {ratedDifficulty.map((value, index) => (
              <div
                key={index}
                className="w-1/3 bg-secondary tooltip tooltip-info origin-bottom animate-grow"
                style={{
                  height: `${(value / max) * 100}%`,
                }}
                data-tip={value}
              ></div>
            ))}
            {ratedDifficulty.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'mask bg-accent w-4 aspect-square',
                  index >= 5
                    ? 'mask-star-2 scale-105'
                    : 'mask-circle scale-[0.8]'
                )}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

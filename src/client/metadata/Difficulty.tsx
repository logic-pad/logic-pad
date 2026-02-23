import { memo, useId, useMemo } from 'react';
import { cn } from '../../client/uiHelper.ts';
import { BsQuestionCircleFill } from 'react-icons/bs';
import { FaMinus, FaPlus } from 'react-icons/fa';

export function medianFromHistogram(ratedDifficulty: number[]) {
  const total = ratedDifficulty.reduce((acc, val) => acc + val, 0);
  const half = total / 2;

  if (total === 0) return 0;

  let current = 0;
  for (let i = 0; i < ratedDifficulty.length; i++) {
    current += ratedDifficulty[i];
    if (current > half) {
      return i + 1;
    }
  }

  return 0;
}

export interface DifficultyProps {
  value: number;
  ratedDifficulty?: number[];
  readonly?: boolean;
  onChange?: (value: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

function sizeToRating(size: DifficultyProps['size']) {
  switch (size) {
    case 'xs':
      return 'rating-xs';
    case 'sm':
      return 'rating-sm';
    case 'lg':
      return 'rating-lg';
    default:
      return 'rating-md';
  }
}

function compareWithRating(value: number, rating: number) {
  if (rating === 0 || value === 0) return '';
  if (value - rating === 1) return <FaMinus />;
  if (value - rating === -1) return <FaPlus />;
  if (value - rating > 1) return [<FaMinus key={1} />, <FaMinus key={2} />];
  if (value - rating < -1) return [<FaPlus key={1} />, <FaPlus key={2} />];
  return '';
}

export default memo(function Difficulty({
  value,
  ratedDifficulty,
  readonly,
  onChange,
  size,
  className,
}: DifficultyProps) {
  const radioId = useId();
  readonly = readonly ?? !onChange;
  const rated = useMemo(
    () => (ratedDifficulty ? medianFromHistogram(ratedDifficulty) : 0),
    [ratedDifficulty]
  );
  size = size ?? 'md';
  if (readonly && value === 0) {
    return (
      <div
        className={cn('rating', sizeToRating(size), 'w-fit h-fit', className)}
      >
        <BsQuestionCircleFill
          size={18}
          aria-hidden="true"
          className="text-neutral-content opacity-100 bg-transparent"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        'rating',
        sizeToRating(size),
        className,
        'flex items-center'
      )}
      role="radiogroup"
      aria-label={readonly ? `Difficulty rating: ${value}` : undefined}
    >
      {[
        <input
          key={-1}
          type="radio"
          name={`difficulty-rating-${radioId}`}
          aria-hidden={readonly ? 'true' : undefined}
          aria-label="Remove rating"
          className="rating-hidden pointer-events-none hidden"
          checked={value === 0}
          readOnly={true}
        />,
        ...Array.from({ length: readonly ? 5 : 10 }, (_, i) => (
          <input
            key={i}
            type="radio"
            aria-hidden={readonly ? 'true' : undefined}
            aria-label={`Rate difficulty ${i + 1 + (readonly && value > 5 ? 5 : 0)}`}
            name={`difficulty-rating-${radioId}`}
            className={cn(
              'mask mask-circle bg-accent scale-[0.8]',
              !readonly &&
                i >= 5 &&
                'mask-star-2 scale-105 relative -top-[0.1rem]',
              readonly &&
                value > 5 &&
                'mask-star-2 scale-105 relative -top-[0.1rem]',
              readonly && 'pointer-events-none',
              readonly &&
                i > (value - 1) % 5 &&
                (rated > 0 ? 'hidden' : 'opacity-0')
            )}
            checked={readonly ? (value - 1) % 5 === i : value === i + 1}
            onChange={() => !readonly && onChange?.(i + 1)}
          />
        )),
      ]}
      {readonly && rated > 0 && (
        <span className="w-fit flex items-center gap-0.5 ms-0.5 text-xs bg-transparent opacity-50 *:w-[0.6em] *:aspect-square **:bg-transparent **:text-base-content **:opacity-100">
          {compareWithRating(value, rated)}
        </span>
      )}
    </div>
  );
});

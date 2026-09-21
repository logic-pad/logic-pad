import { memo } from 'react';
import { cn } from '../uiHelper';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { tip } from './Tooltip.tsx';
import './supporterBadge.css';

export interface SupporterBadgeProps {
  supporter: number;
  className?: string;
  tooltip?: boolean;
}

export default memo(function SupporterBadge({
  supporter,
  className,
  tooltip = false,
}: SupporterBadgeProps) {
  if (!supporter) return null;

  return (
    <span
      className={cn(
        'relative w-fit h-[0.91em] inline-block align-baseline ms-[0.3em]',
        (supporter === 2 || supporter === 3) && 'text-accent',
        className
      )}
      {...(tooltip ? tip('Supporter', 'bottom', 'accent') : {})}
    >
      {supporter === 3 ? (
        <FaHeart className="effect-shine" />
      ) : (
        <FaRegHeart className="effect-shine" />
      )}
    </span>
  );
});

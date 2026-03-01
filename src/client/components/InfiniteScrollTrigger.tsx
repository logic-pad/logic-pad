import { memo, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { cn } from '../uiHelper';

export interface InfiniteScrollTriggerProps {
  onLoadMore?: () => void;
  autoTrigger?: boolean;
  direction?: 'up' | 'down';
  className?: string;
}

export default memo(function InfiniteScrollTrigger({
  onLoadMore,
  autoTrigger = true,
  direction = 'down',
  className,
}: InfiniteScrollTriggerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!onLoadMore) return;
    if (!autoTrigger) return;
    const currentButton = buttonRef.current;
    if (!currentButton) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: currentButton.closest('.infinite-scroll'),
        rootMargin: '0px',
        threshold: 1.0,
      }
    );
    if (currentButton) {
      observer.observe(currentButton);
    }
    return () => {
      if (currentButton) {
        observer.unobserve(currentButton);
        observer.disconnect();
      }
    };
  }, [onLoadMore, autoTrigger]);
  if (!onLoadMore) return null;
  return (
    <button
      ref={buttonRef}
      className={cn('btn', className)}
      onClick={onLoadMore}
    >
      Load more
      {direction === 'down' ? <FaChevronDown /> : <FaChevronUp />}
    </button>
  );
});

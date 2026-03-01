import { memo } from 'react';
import { cn } from '../uiHelper.ts';

export interface SkeletonProps {
  className?: string;
}

export default memo(function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton opacity-20', className)} />;
});

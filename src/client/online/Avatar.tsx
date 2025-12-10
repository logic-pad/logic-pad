import { memo } from 'react';
import { api } from './api';
import { cn } from '../uiHelper';

export interface AvatarProps {
  userId?: string | null;
  username?: string | null;
  className?: string;
}

export default memo(function Avatar({
  userId,
  username,
  className,
}: AvatarProps) {
  return (
    <img
      src={userId ? api.getAvatar(userId) : undefined}
      alt={`${username}'s avatar`}
      className={cn('rounded-full shrink-0', className)}
    />
  );
});

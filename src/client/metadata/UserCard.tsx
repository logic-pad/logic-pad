import { memo, useId } from 'react';
import { cn } from '../uiHelper';
import { UserBrief } from '../online/data';
import { FaCheckSquare, FaEdit } from 'react-icons/fa';
import { Link } from '@tanstack/react-router';
import Avatar from '../online/Avatar';
import SupporterBadge from '../components/SupporterBadge';
import { StyledTooltip } from '../components/Tooltip';

export interface UserCardProps {
  user?: UserBrief | null;
  name?: string;
  responsive?: boolean;
  tooltip?: boolean;
  className?: string;
}

export default memo(function UserCard({
  user,
  name,
  responsive,
  tooltip,
  className,
}: UserCardProps) {
  responsive ??= true;
  tooltip ??= true;
  name ??= user?.name;

  const tooltipId = `user-card-${useId().replaceAll(':', '')}`;

  return (
    <div className="relative w-fit">
      <Link
        to={user ? '/profile/' + user.id : undefined}
        className={cn(
          'badge badge-secondary rounded-lg shrink-0',
          responsive ? 'lg:badge-lg' : 'badge-lg',
          className
        )}
        data-tooltip-id={tooltip && user ? tooltipId : undefined}
        data-tooltip-place="bottom-start"
      >
        {name}
        <SupporterBadge supporter={user?.supporter ?? 0} />
      </Link>
      {tooltip && user && (
        <StyledTooltip
          id={tooltipId}
          variant="neutral"
          className="no-padding"
          style={{
            backgroundColor: 'transparent',
            maxWidth: 'none',
            borderRadius: '1rem',
          }}
          noArrow
        >
          <div className="w-80 h-fit flex flex-col gap-4 bg-base-300 text-base-content shadow-lg rounded-xl p-4 select-none">
            <div className="flex gap-4">
              <Avatar
                userId={user.id}
                username={user.name}
                className="w-16 h-16"
              />
              <div className="flex flex-col text-left">
                <span className="text-xl font-bold">
                  {user.name}
                  <SupporterBadge supporter={user.supporter} />
                </span>
                {user.title && (
                  <span className="text-sm text-accent font-semibold">
                    {user.title}
                  </span>
                )}
                <div className="flex gap-2 mt-2">
                  <div className="badge badge-xs badge-neutral py-1 px-2 h-6 flex gap-1">
                    <FaCheckSquare />
                    Solved {user.solveCount}
                  </div>
                  <div className="badge badge-xs badge-neutral py-1 px-2 h-6 flex gap-1">
                    <FaEdit />
                    Created {user.createCount}
                  </div>
                </div>
              </div>
            </div>
            {user.description.length > 0 && (
              <div className="text-sm text-muted">{user.description}</div>
            )}
          </div>
        </StyledTooltip>
      )}
    </div>
  );
});

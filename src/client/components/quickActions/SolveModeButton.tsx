import { memo } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { FaStarHalfAlt } from 'react-icons/fa';
import { tip } from '../Tooltip.tsx';

export default memo(function SolveModeButton() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const search = useRouterState({ select: s => s.location.search });
  return (
    <Link
      to={pathname.replace('/perfection', '/solve')}
      search={search}
      className="btn btn-md btn-ghost flex items-center w-fit focus:z-50"
      {...tip('Switch to solve mode', 'right')}
    >
      <FaStarHalfAlt size={24} />
    </Link>
  );
});

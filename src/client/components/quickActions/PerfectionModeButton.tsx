import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { getGridAtom } from '../../state/grid.ts';
import { instance as musicGridInstance } from '@logic-pad/core/data/rules/musicGridRule';
import { Link, useRouterState } from '@tanstack/react-router';
import { FaStar } from 'react-icons/fa';
import { tip } from '../Tooltip.tsx';

export default memo(function PerfectionModeButton() {
  const grid = useAtomValue(getGridAtom);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const search = useRouterState({ select: s => s.location.search });
  if (grid.findRule(r => r.id === musicGridInstance.id)) return null;
  return (
    <Link
      to={pathname.replace('/solve', '/perfection')}
      search={search}
      className="btn btn-md btn-ghost flex items-center w-fit focus:z-50"
      {...tip('Switch to perfection mode', 'right')}
    >
      <FaStar size={24} />
    </Link>
  );
});

import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { gridAtom } from '../../state/grid.ts';
import { instance as musicGridInstance } from '@logic-pad/core/data/rules/musicGridRule';
import { Link, useRouterState } from '@tanstack/react-router';
import { FaStar } from 'react-icons/fa';

export default memo(function PerfectionModeButton() {
  const grid = useAtomValue(gridAtom);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const search = useRouterState({ select: s => s.location.search });
  if (grid.findRule(r => r.id === musicGridInstance.id)) return null;
  return (
    <Link
      to={pathname.replace('/solve', '/perfection')}
      search={search}
      className="tooltip tooltip-info tooltip-right btn btn-md btn-ghost flex items-center w-fit focus:z-50"
      data-tip="Switch to perfection mode"
    >
      <FaStar size={24} />
    </Link>
  );
});

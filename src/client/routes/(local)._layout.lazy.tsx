import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { LayoutWithTopNav } from './_layout.lazy';
import { memo } from 'react';

export const DevLinks = memo(function DevLinks() {
  if (import.meta.env.DEV) {
    return (
      <div className="flex flex-wrap gap-4 items-center bg-secondary/5 border border-secondary rounded-lg p-2">
        <span>Dev mode:</span>
        <Link
          type="button"
          to="/dev/color"
          className="btn btn-sm btn-secondary btn-outline"
        >
          color
        </Link>
        <Link
          type="button"
          to="/dev/puzzles"
          className="btn btn-sm btn-secondary btn-outline"
        >
          puzzles
        </Link>
      </div>
    );
  }
  return null;
});

export const Route = createLazyFileRoute('/(local)/_layout')({
  component: LayoutWithTopNav,
});

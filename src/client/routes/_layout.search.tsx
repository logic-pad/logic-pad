import { createFileRoute, Outlet } from '@tanstack/react-router';
import { memo } from 'react';
import { FaSearch } from 'react-icons/fa';
import ResponsiveLayout from '../components/ResponsiveLayout';

export const Route = createFileRoute('/_layout/search')({
  component: memo(function Search() {
    return (
      <ResponsiveLayout>
        <div className="text-3xl mt-8">
          <FaSearch className="inline-block me-4" aria-hidden="true" />
          Search
        </div>
        <Outlet />
      </ResponsiveLayout>
    );
  }),
});

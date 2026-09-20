import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router';
import ThemeSynchronizer from '../state/theme.ts';
import TanStackDevTools from '../router/TanStackDevTools';
import { memo } from 'react';
import { Toaster } from 'react-hot-toast';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        title: 'Logic Pad',
      },
    ],
  }),
  component: memo(function Root() {
    return (
      <div className="h-dvh w-dvw overflow-y-auto overflow-x-hidden bg-neutral text-neutral-content">
        <ThemeSynchronizer />
        <HeadContent />
        <Toaster
          toastOptions={{
            className: '!bg-base-100 !text-base-content',
            success: {
              className:
                '!bg-base-100 !text-base-content border! !border-success/50',
            },
            error: {
              className:
                '!bg-base-100 !text-base-content border! !border-error/50',
            },
          }}
        />
        <div className="flex flex-col items-stretch w-full min-h-full xl:h-full">
          <Outlet />
          <TanStackDevTools />
        </div>
      </div>
    );
  }),
});

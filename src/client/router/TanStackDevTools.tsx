import React, { Suspense, memo } from 'react';

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : React.lazy(() =>
      // Lazy load in development
      import('@tanstack/react-router-devtools').then(m => ({
        default: m.TanStackRouterDevtools,
      }))
    );

export default memo(function TanStackDevTools() {
  return (
    <Suspense>
      <TanStackRouterDevtools />
    </Suspense>
  );
});

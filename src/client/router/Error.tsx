import { ErrorComponentProps, Link } from '@tanstack/react-router';
import { memo } from 'react';

export default memo(function Error({ error, info }: ErrorComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center self-stretch flex-1 gap-4">
      <meta name="robots" content="noindex" />
      <h1 className="text-4xl">Unexpected error</h1>
      <div>
        Please report this issue to the developer and include the following
        information:
      </div>
      <div className="w-full max-w-[1000px] max-h-1/2 overflow-auto border border-base-100">
        <div className="flex flex-col gap-2 p-4 w-fit">
          <div className="text-lg text-accent">{error.name}</div>
          <pre>{error.message}</pre>
          <div className="uppercase font-semibold text-accent">Stack trace</div>
          <pre>{error.stack ?? 'None'}</pre>
          <div className="uppercase font-semibold text-accent">
            Component stack
          </div>
          <pre>{info?.componentStack ?? 'None'}</pre>
        </div>
      </div>
      <Link to="/" reloadDocument className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
});

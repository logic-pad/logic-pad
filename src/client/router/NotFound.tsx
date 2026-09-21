import { Link } from '@tanstack/react-router';
import { memo } from 'react';

export default memo(function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center self-stretch flex-1 gap-4">
      <meta name="robots" content="noindex" />
      <h1 className="text-4xl">Not found</h1>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
});

import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/color')({
  loader: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
});

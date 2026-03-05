import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/(local)/_layout/dev/puzzles')({
  beforeLoad: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      {
        title: `Dev Puzzles - Logic Pad`,
      },
    ],
  }),
});

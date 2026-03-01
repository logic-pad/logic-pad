import { createFileRoute } from '@tanstack/react-router';
import { validateSearch } from '../router/linkLoaderValidator';

export const Route = createFileRoute('/_layout/create/')({
  validateSearch,
  head: () => ({
    meta: [
      {
        title: `Puzzle Editor - Logic Pad`,
      },
    ],
  }),
});

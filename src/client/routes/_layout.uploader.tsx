import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/uploader')({
  head: () => ({
    meta: [
      {
        title: `Puzzle Uploader - Logic Pad`,
      },
    ],
  }),
});

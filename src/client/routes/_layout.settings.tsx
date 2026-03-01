import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/settings')({
  head: () => ({
    meta: [
      {
        title: `Account Settings - Logic Pad`,
      },
    ],
  }),
});

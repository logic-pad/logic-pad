import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/(local)/_layout/dev/color')({
  beforeLoad: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      {
        title: `Color Palette - Logic Pad`,
      },
    ],
  }),
});

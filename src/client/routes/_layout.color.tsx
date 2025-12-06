import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/color')({
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

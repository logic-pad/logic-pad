import { createLazyFileRoute } from '@tanstack/react-router';
import { LayoutWithTopNav } from './_layout.lazy';

export const Route = createLazyFileRoute('/(local)/_layout')({
  component: LayoutWithTopNav,
});

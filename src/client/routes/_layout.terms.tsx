import { createFileRoute } from '@tanstack/react-router';
import { memo } from 'react';
import terms from '../../../TERMS.md?raw';
import Markdown from '../components/Markdown';
import ResponsiveLayout from '../components/ResponsiveLayout';
import Footer from '../components/Footer';

export const Route = createFileRoute('/_layout/terms')({
  component: memo(function RouteComponent() {
    return (
      <ResponsiveLayout footer={<Footer />}>
        <Markdown className="font-sans">{terms}</Markdown>
      </ResponsiveLayout>
    );
  }),
  head: () => ({
    meta: [
      {
        title: `Terms of Service - Logic Pad`,
      },
    ],
  }),
});

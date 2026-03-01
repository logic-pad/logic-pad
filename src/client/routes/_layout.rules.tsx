import { createFileRoute } from '@tanstack/react-router';
import { memo } from 'react';
import rules from '../../../RULES.md?raw';
import Markdown from '../components/Markdown';
import ResponsiveLayout from '../components/ResponsiveLayout';
import Footer from '../components/Footer';

export const Route = createFileRoute('/_layout/rules')({
  component: memo(function RouteComponent() {
    return (
      <ResponsiveLayout footer={<Footer />}>
        <Markdown className="font-sans">{rules}</Markdown>
      </ResponsiveLayout>
    );
  }),
  head: () => ({
    meta: [
      {
        title: `Rules - Logic Pad`,
      },
    ],
  }),
});

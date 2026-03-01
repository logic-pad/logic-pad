import { createFileRoute } from '@tanstack/react-router';
import { memo } from 'react';
import privacy from '../../../PRIVACY.md?raw';
import Markdown from '../components/Markdown';
import ResponsiveLayout from '../components/ResponsiveLayout';
import Footer from '../components/Footer';

export const Route = createFileRoute('/_layout/privacy-policy')({
  component: memo(function RouteComponent() {
    return (
      <ResponsiveLayout footer={<Footer />}>
        <Markdown className="font-sans">{privacy}</Markdown>
      </ResponsiveLayout>
    );
  }),
  head: () => ({
    meta: [
      {
        title: `Privacy Policy - Logic Pad`,
      },
    ],
  }),
});

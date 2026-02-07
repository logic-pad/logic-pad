import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { api } from '../online/api';
import Markdown from './Markdown';
import { cn, getHighlightColor } from '../uiHelper';

export default memo(function Changelog() {
  const { data } = useQuery({
    queryKey: ['frontpage'],
    queryFn: api.getFrontPage,
  });
  if (!data) return null;
  if (!data.note) return null;
  return (
    <div
      className={cn(
        'w-full mt-8 px-6 py-4 shrink-0 flex flex-col items-stretch',
        'border-y rounded-lg',
        getHighlightColor(data.note.highlight)
      )}
    >
      <Markdown className="prose-sm prose-h1:text-lg text-neutral-content">
        {data.note.content}
      </Markdown>
    </div>
  );
});

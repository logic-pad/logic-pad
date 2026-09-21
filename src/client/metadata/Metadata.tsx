import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { metadataAtom } from '../state/grid.ts';
import Difficulty from './Difficulty';
import Markdown from '../components/Markdown';
import { cn, toRelativeDate } from '../uiHelper.ts';
import UserCard from './UserCard.tsx';
import { tip } from '../components/Tooltip.tsx';
import { onlinePuzzleAtom } from '../state/onlinePuzzle.ts';

export interface MetadataProps {
  simplified?: boolean;
  responsive?: boolean;
}

export default memo(function Metadata({
  simplified,
  responsive,
}: MetadataProps) {
  simplified = simplified ?? false;
  responsive = responsive ?? true;
  const metadata = useAtomValue(metadataAtom);
  const puzzle = useAtomValue(onlinePuzzleAtom);

  return (
    <section className="flex flex-col gap-4">
      <div
        className="w-fit"
        {...tip(
          metadata.difficulty === 0
            ? 'Unrated'
            : `Design difficulty: ${metadata.difficulty}`,
          'right'
        )}
      >
        <Difficulty value={metadata.difficulty} />
      </div>
      <h1
        className={cn(
          'shrink-0 wrap-break-word',
          responsive ? 'text-3xl lg:text-4xl' : 'text-4xl'
        )}
      >
        {metadata.title}
      </h1>
      <div className="flex gap-2 flex-wrap items-center">
        <UserCard user={puzzle?.creator} name={metadata.author} />
        {puzzle?.publishedAt && (
          <span className="opacity-80">
            {toRelativeDate(new Date(puzzle.publishedAt))}
          </span>
        )}
      </div>
      {!simplified && (
        <div className="overflow-y-auto">
          <Markdown
            className={cn('max-w-full', responsive ? 'lg:prose-lg' : '')}
          >
            {metadata.description}
          </Markdown>
        </div>
      )}
    </section>
  );
});

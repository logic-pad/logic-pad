import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { api } from './api';
import HorizontalScroller from '../components/HorizontalScroller';
import PuzzleCard from './PuzzleCard';
import CollectionCard from './CollectionCard';
import Skeleton from '../components/Skeleton';

export default memo(function FrontPageLists() {
  const { data } = useQuery({
    queryKey: ['frontpage'],
    queryFn: api.getFrontPage,
  });
  if (!data) {
    return (
      <>
        <HorizontalScroller
          title="Newest Puzzles"
          scrollable={false}
          className="flex-wrap box-content max-h-[calc(116px*2+1rem)] w-full"
          to="/search/puzzles"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="w-[320px] h-[116px]" />
          ))}
        </HorizontalScroller>
        <HorizontalScroller
          title="Newest Collections"
          scrollable={false}
          className="flex-wrap box-content max-h-[calc(96px*2+1rem)] w-full"
          to="/search/collections"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="w-[320px] h-[96px]" />
          ))}
        </HorizontalScroller>
      </>
    );
  }
  return data.sections.map(section =>
    section.type === 'puzzles' ? (
      <HorizontalScroller
        key={section.title}
        title={section.title}
        description={section.description ?? undefined}
        highlight={section.highlight ?? undefined}
        scrollable={false}
        className="flex-wrap box-content max-h-[calc(116px*2+1rem)] w-full"
        href={section.link ?? undefined}
      >
        {section.items.map(puzzle => (
          <PuzzleCard
            key={puzzle.id}
            puzzle={puzzle}
            expandable={false}
            to="/solve/$puzzleId"
            params={{ puzzleId: puzzle.id }}
          />
        ))}
      </HorizontalScroller>
    ) : section.type === 'collections' ? (
      <HorizontalScroller
        key={section.title}
        title={section.title}
        description={section.description ?? undefined}
        highlight={section.highlight ?? undefined}
        scrollable={false}
        className="flex-wrap box-content max-h-[calc(96px*2+1rem)] w-full"
        href={section.link ?? undefined}
      >
        {section.items.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            expandable={false}
            to="/collection/$collectionId"
            params={{ collectionId: collection.id }}
          />
        ))}
      </HorizontalScroller>
    ) : null
  );
});

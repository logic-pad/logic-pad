import { useInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';
import HorizontalScroller from '../components/HorizontalScroller';
import CollectionCard from './CollectionCard';
import { followedCollectionsInfiniteQueryOptions } from '../routes/_layout.my-follows';
import Skeleton from '../components/Skeleton';

export default memo(function PersonalFrontPageLists() {
  const { data, isPending } = useInfiniteQuery(
    followedCollectionsInfiniteQueryOptions({})
  );
  return (
    <HorizontalScroller
      title="Followed collections"
      scrollable={false}
      className="flex-wrap box-content max-h-[calc(96px*2+1rem)] w-full"
      to="/my-follows"
    >
      {isPending
        ? Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="w-[320px] h-[96px]" />
          ))
        : data?.pages[0]?.results.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              expandable={false}
              to="/collection/$collectionId"
              params={{ collectionId: collection.id }}
            />
          ))}
    </HorizontalScroller>
  );
});

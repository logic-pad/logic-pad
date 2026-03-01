import { memo } from 'react';
import { AutoCollection, CollectionBrief, ResourceStatus } from './data';
import { FaEyeSlash, FaListOl, FaListUl, FaUser } from 'react-icons/fa';
import { cn } from '../uiHelper';
import { TbLayoutGrid } from 'react-icons/tb';
import Avatar from './Avatar';
import { Link, LinkComponentProps } from '@tanstack/react-router';
import SupporterBadge from '../components/SupporterBadge';

export interface CollectionCardProps extends Partial<LinkComponentProps> {
  collection: CollectionBrief;
  expandable?: boolean;
  onClick?: () => void;
}

export default memo(function CollectionCard({
  collection,
  expandable = true,
  ...props
}: CollectionCardProps) {
  const RootComponent = props.to ? Link : 'a';
  return (
    <div className="w-[320px] h-[96px] [:hover]:z-50 shrink-0 grow-0">
      <RootComponent
        preload={false}
        className={cn(
          'w-full h-full [:hover]:h-fit flex flex-col gap-2 px-4 py-2 rounded-xl shadow-md wrapper [:hover]:shadow-xl [:hover]:outline-2 -outline-offset-2 outline-accent transition-all text-base-content',
          collection.status === ResourceStatus.Private
            ? `bg-base-300/50 [:hover]:bg-base-100`
            : 'bg-base-300 [:hover]:bg-base-100'
        )}
        role="button"
        {...props}
      >
        <div className="flex gap-4 items-center">
          {collection.autoPopulate === AutoCollection.CreatedPuzzles ? (
            <Avatar
              userId={collection.creator.id}
              username={collection.creator.name}
              className="w-[36px] h-[36px] shrink-0"
            />
          ) : collection.isSeries ? (
            <FaListOl size={36} className="shrink-0 text-accent" />
          ) : (
            <FaListUl size={36} className="shrink-0" />
          )}
          <div className="flex flex-col">
            <h2
              className={cn(
                'text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis',
                expandable &&
                  '[.wrapper:hover_&]:whitespace-normal [.wrapper:hover_&]:wrap-break-word',
                collection.isSeries && 'text-accent'
              )}
            >
              {collection.title.length === 0
                ? 'Untitled Collection'
                : collection.title}
            </h2>
            <div className="badge badge-neutral bg-neutral/40 badge-md mt-1 gap-0">
              {collection.creator.name}
              <SupporterBadge supporter={collection.creator.supporter} />
            </div>
            <div className="flex gap-4 text-sm opacity-80 mt-2">
              {collection.puzzleCount !== null && (
                <span className="flex items-center">
                  <TbLayoutGrid className="me-2" /> {collection.puzzleCount}
                  <span className="hidden [.wrapper:hover_&]:inline-block ms-1">
                    {collection.puzzleCount === 1 ? 'puzzle' : 'puzzles'}
                  </span>
                </span>
              )}
              {collection.status !== ResourceStatus.Private && (
                <span className="flex items-center">
                  <FaUser className="me-2" /> {collection.followCount}
                  <span className="hidden [.wrapper:hover_&]:inline-block ms-1">
                    {collection.followCount === 1 ? 'follow' : 'follows'}
                  </span>
                </span>
              )}
              {collection.status !== ResourceStatus.Public && (
                <span className="flex items-center capitalize">
                  <FaEyeSlash className="me-2" />
                  <span className="[.wrapper:hover_&]:hidden">
                    {collection.status}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        {(collection.description?.length ?? 0) > 0 && (
          <div
            className={cn(
              'hidden text-sm',
              expandable && '[.wrapper:hover_&]:block'
            )}
          >
            {collection.description.length > 120
              ? collection.description.slice(0, 120) + '...'
              : collection.description}
          </div>
        )}
      </RootComponent>
    </div>
  );
});

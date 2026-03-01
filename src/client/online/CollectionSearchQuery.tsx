import React, {
  Fragment,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import debounce from 'lodash/debounce';
import { FaSearch, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { z } from 'zod';
import { useOnline } from '../contexts/OnlineContext';
import { cn } from '../uiHelper';

export const collectionSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  type: z.enum(['handmade', 'created', 'auto']).optional().catch(undefined),
  sort: z
    .enum([
      'created-asc',
      'created-desc',
      'updated-asc',
      'updated-desc',
      'follow-asc',
      'follow-desc',
    ])
    .optional()
    .catch(undefined),
});

export type CollectionSearchParams = z.infer<typeof collectionSearchSchema>;

type FilterOption = {
  id: string;
  text: string | React.ReactElement;
  applyFilter: (search: CollectionSearchParams) => CollectionSearchParams;
  isActive: (search: CollectionSearchParams) => boolean;
};

type Filter = {
  name: string;
  options: FilterOption[];
};

const filters: Filter[] = [
  {
    name: 'Type',
    options: [
      {
        id: 'any',
        text: 'Any',
        applyFilter: search => {
          return { ...search, type: undefined };
        },
        isActive: search => !search.type,
      },
      {
        id: 'handmade',
        text: 'Handmade',
        applyFilter: search => {
          const newValue = search.type === 'handmade' ? undefined : 'handmade';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'handmade',
      },
      {
        id: 'created',
        text: "Creator's list",
        applyFilter: search => {
          const newValue = search.type === 'created' ? undefined : 'created';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'created',
      },
      {
        id: 'auto',
        text: 'Auto',
        applyFilter: search => {
          const newValue = search.type === 'auto' ? undefined : 'auto';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'auto',
      },
    ],
  },
];

const orderings = [
  {
    id: 'created',
    text: 'Creation Date',
  },
  {
    id: 'updated',
    text: 'Update Date',
  },
  {
    id: 'follow',
    text: 'Follow Count',
  },
] as const;

export interface CollectionSearchQueryProps {
  params: CollectionSearchParams;
  onChange: (params: CollectionSearchParams) => void;
}

export default memo(function CollectionSearchQuery({
  params,
  onChange,
}: CollectionSearchQueryProps) {
  const { me } = useOnline();
  const [displayParams, setDisplayParams] =
    useState<CollectionSearchParams>(params);
  const updateParams = useMemo(() => {
    const debouncedUpdate = debounce(
      (newParams: CollectionSearchParams) => {
        onChange(newParams);
      },
      500,
      { trailing: true }
    );
    return (newParams: CollectionSearchParams) => {
      setDisplayParams(newParams);
      debouncedUpdate(newParams);
    };
  }, [onChange]);

  useEffect(() => {
    setDisplayParams(params);
  }, [params]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = displayParams.q ?? '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div
        className={cn('w-full', !me && 'tooltip tooltip-info tooltip-top')}
        data-tip={!me && 'Log in to search'}
      >
        <label
          className={cn(
            'input bg-base-100 text-base-content flex items-center gap-2 w-full',
            !me && 'input-disabled'
          )}
        >
          <FaSearch aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="grow"
            placeholder={me ? 'Enter search terms' : 'Log in to search'}
            disabled={!me}
            onChange={e =>
              updateParams({ ...displayParams, q: e.target.value })
            }
          />
        </label>
      </div>
      <div className="grid grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] items-start gap-y-2">
        {filters.map(filter => (
          <Fragment key={filter.name}>
            <div>{filter.name}</div>
            <div className="flex gap-2 flex-wrap">
              {filter.options.map(option => (
                <button
                  key={option.id}
                  className={cn(
                    `btn btn-sm`,
                    option.isActive(displayParams) ? '' : 'btn-ghost',
                    !me && 'btn-disabled'
                  )}
                  onClick={() =>
                    updateParams(option.applyFilter(displayParams))
                  }
                >
                  {option.text}
                </button>
              ))}
            </div>
          </Fragment>
        ))}
        <div className="mt-2">Sort by</div>
        <div className="flex gap-4 mt-2 flex-wrap">
          {orderings.map(ordering => (
            <button
              key={ordering.id}
              className={cn(
                `btn btn-sm`,
                displayParams.sort?.startsWith(`${ordering.id}-`)
                  ? ''
                  : 'btn-ghost',
                !me && 'btn-disabled'
              )}
              onClick={() => {
                let newParams: CollectionSearchParams;
                if (displayParams.sort === `${ordering.id}-asc`) {
                  newParams = { ...displayParams, sort: undefined };
                } else if (displayParams.sort === `${ordering.id}-desc`) {
                  newParams = { ...displayParams, sort: `${ordering.id}-asc` };
                } else {
                  newParams = { ...displayParams, sort: `${ordering.id}-desc` };
                }
                updateParams(newParams);
              }}
            >
              {ordering.text}
              {displayParams.sort?.startsWith(`${ordering.id}-`) &&
                (displayParams.sort.endsWith('-asc') ? (
                  <FaChevronUp aria-label="Ascending" />
                ) : (
                  <FaChevronDown aria-label="Descending" />
                ))}
            </button>
          ))}
        </div>
      </div>
    </>
  );
});

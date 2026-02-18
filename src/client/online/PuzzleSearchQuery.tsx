import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { FaSearch, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { z } from 'zod';
import { useOnline } from '../contexts/OnlineContext';
import { cn } from '../uiHelper';

export type SearchType = 'public' | 'own' | 'published' | 'all';

export const puzzleSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  type: z
    .enum(['logic', 'underclued', 'pattern', 'music'])
    .optional()
    .catch(undefined),
  size: z.enum(['s', 'm', 'l']).optional().catch(undefined),
  minDiff: z.number().min(1).max(10).optional().catch(undefined),
  maxDiff: z.number().min(1).max(10).optional().catch(undefined),
  solve: z.enum(['unseen', 'unsolved']).optional().catch(undefined),
  sort: z
    .enum([
      'published-asc',
      'published-desc',
      'solve-asc',
      'solve-desc',
      'love-asc',
      'love-desc',
      'difficulty-asc',
      'difficulty-desc',
    ])
    .optional()
    .catch(undefined),
});

export const privatePuzzleSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  type: z
    .enum(['logic', 'underclued', 'pattern', 'music'])
    .optional()
    .catch(undefined),
  size: z.enum(['s', 'm', 'l']).optional().catch(undefined),
  minDiff: z.number().min(1).max(10).optional().catch(undefined),
  maxDiff: z.number().min(1).max(10).optional().catch(undefined),
  solve: z.enum(['unseen', 'unsolved']).optional().catch(undefined),
  sort: z
    .enum([
      'created-asc',
      'created-desc',
      'solve-asc',
      'solve-desc',
      'love-asc',
      'love-desc',
      'difficulty-asc',
      'difficulty-desc',
    ])
    .optional()
    .catch(undefined),
});

export type PublicPuzzleSearchParams = z.infer<typeof puzzleSearchSchema>;
export type PrivatePuzzleSearchParams = z.infer<
  typeof privatePuzzleSearchSchema
>;
export type PuzzleSearchParams<Search extends SearchType> = Search extends
  | 'public'
  | 'published'
  ? PublicPuzzleSearchParams
  : PrivatePuzzleSearchParams;

type FilterOption = {
  id: string;
  text: string | React.ReactElement;
  applyFilter: (
    search: PublicPuzzleSearchParams | PrivatePuzzleSearchParams
  ) => PublicPuzzleSearchParams | PrivatePuzzleSearchParams;
  isActive: (
    search: PublicPuzzleSearchParams | PrivatePuzzleSearchParams
  ) => boolean;
};

type Filter = {
  name: string;
  supporter?: boolean;
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
        id: 'logic',
        text: 'Logic',
        applyFilter: search => {
          const newValue = search.type === 'logic' ? undefined : 'logic';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'logic',
      },
      {
        id: 'underclued',
        text: 'Underclued',
        applyFilter: search => {
          const newValue =
            search.type === 'underclued' ? undefined : 'underclued';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'underclued',
      },
      {
        id: 'pattern',
        text: 'Pattern',
        applyFilter: search => {
          const newValue = search.type === 'pattern' ? undefined : 'pattern';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'pattern',
      },
      {
        id: 'music',
        text: 'Music',
        applyFilter: search => {
          const newValue = search.type === 'music' ? undefined : 'music';
          return { ...search, type: newValue };
        },
        isActive: search => search.type === 'music',
      },
    ],
  },
  {
    name: 'Size',
    options: [
      {
        id: 'any',
        text: 'Any',
        applyFilter: search => {
          return { ...search, size: undefined };
        },
        isActive: search => !search.size,
      },
      {
        id: 's',
        text: 'Small',
        applyFilter: search => {
          const newValue = search.size === 's' ? undefined : 's';
          return { ...search, size: newValue };
        },
        isActive: search => search.size === 's',
      },
      {
        id: 'm',
        text: 'Medium',
        applyFilter: search => {
          const newValue = search.size === 'm' ? undefined : 'm';
          return { ...search, size: newValue };
        },
        isActive: search => search.size === 'm',
      },
      {
        id: 'l',
        text: 'Large',
        applyFilter: search => {
          const newValue = search.size === 'l' ? undefined : 'l';
          return { ...search, size: newValue };
        },
        isActive: search => search.size === 'l',
      },
    ],
  },
  {
    name: 'Difficulty',
    options: [
      {
        id: 'any',
        text: 'Any',
        applyFilter: search => {
          return { ...search, minDiff: undefined, maxDiff: undefined };
        },
        isActive: search => !search.minDiff && !search.maxDiff,
      },
      {
        id: '1-4',
        text: (
          <>
            1 <span className="w-4 h-4 bg-accent mask mask-circle" /> - 4{' '}
            <span className="w-4 h-4 bg-accent mask mask-circle" />
          </>
        ),
        applyFilter: search => {
          if (search.minDiff !== 1 || search.maxDiff !== 4) {
            return { ...search, minDiff: 1, maxDiff: 4 };
          } else {
            return { ...search, minDiff: undefined, maxDiff: undefined };
          }
        },
        isActive: search => search.minDiff === 1 && search.maxDiff === 4,
      },
      {
        id: '5-7',
        text: (
          <>
            5 <span className="w-4 h-4 bg-accent mask mask-circle" /> - 7{' '}
            <span className="w-4 h-4 bg-accent mask mask-star-2 scale-105" />
          </>
        ),
        applyFilter: search => {
          if (search.minDiff !== 5 || search.maxDiff !== 7) {
            return { ...search, minDiff: 5, maxDiff: 7 };
          } else {
            return { ...search, minDiff: undefined, maxDiff: undefined };
          }
        },
        isActive: search => search.minDiff === 5 && search.maxDiff === 7,
      },
      {
        id: '8-10',
        text: (
          <>
            8 <span className="w-4 h-4 bg-accent mask mask-star-2 scale-105" />{' '}
            - 10{' '}
            <span className="w-4 h-4 bg-accent mask mask-star-2 scale-105" />
          </>
        ),
        applyFilter: search => {
          if (search.minDiff !== 8 || search.maxDiff !== 10) {
            return { ...search, minDiff: 8, maxDiff: 10 };
          } else {
            return { ...search, minDiff: undefined, maxDiff: undefined };
          }
        },
        isActive: search => search.minDiff === 8 && search.maxDiff === 10,
      },
    ],
  },
  {
    name: 'Solve',
    supporter: true,
    options: [
      {
        id: 'any',
        text: 'Any',
        applyFilter: search => {
          return { ...search, solve: undefined };
        },
        isActive: search => !search.solve,
      },
      {
        id: 'unseen',
        text: 'Unseen',
        applyFilter: search => {
          const newValue = search.solve === 'unseen' ? undefined : 'unseen';
          return { ...search, solve: newValue };
        },
        isActive: search => search.solve === 'unseen',
      },
      {
        id: 'unsolved',
        text: 'Unsolved',
        applyFilter: search => {
          const newValue = search.solve === 'unsolved' ? undefined : 'unsolved';
          return { ...search, solve: newValue };
        },
        isActive: search => search.solve === 'unsolved',
      },
    ],
  },
];

const orderings = [
  {
    id: 'published',
    text: 'Published Date',
  },
  {
    id: 'created',
    text: 'Creation Date',
  },
  {
    id: 'solve',
    text: 'Solve Count',
  },
  {
    id: 'love',
    text: 'Love Count',
  },
  {
    id: 'difficulty',
    text: 'Difficulty',
  },
] as const;

export interface PuzzleSearchQueryProps<Search extends SearchType> {
  params: PuzzleSearchParams<Search>;
  /**
   * Sorting by published date is only possible for public puzzles.
   */
  searchType: Search;
  onChange: (params: PuzzleSearchParams<Search>) => void;
}

export default function PuzzleSearchQuery<Search extends SearchType>({
  params,
  searchType,
  onChange,
}: PuzzleSearchQueryProps<Search>) {
  const { me } = useOnline();
  const [displayParams, setDisplayParams] =
    useState<PuzzleSearchParams<Search>>(params);
  const updateParams = useMemo(() => {
    const debouncedUpdate = debounce(
      (newParams: PuzzleSearchParams<Search>) => {
        if (!me) {
          onChange({});
        } else {
          onChange(newParams);
        }
      },
      500,
      { trailing: true }
    );
    return (newParams: PuzzleSearchParams<Search>) => {
      setDisplayParams(newParams);
      debouncedUpdate(newParams);
    };
  }, [onChange, me]);

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
      <div className="grid grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] items-start gap-y-1">
        {filters.map(filter => {
          const promptForSupporter =
            filter.supporter && (!me || me.supporter === 0);
          return (
            <Fragment key={filter.name}>
              <div>{filter.name}</div>
              <div
                className={cn(
                  'flex gap-2 flex-wrap',
                  promptForSupporter && 'tooltip tooltip-left tooltip-info'
                )}
                data-tip={promptForSupporter ? 'Requires supporter status' : ''}
              >
                {filter.options.map(option => (
                  <button
                    key={option.id}
                    className={cn(
                      `btn btn-sm`,
                      option.isActive(displayParams) ? '' : 'btn-ghost',
                      !me && 'btn-disabled',
                      promptForSupporter && 'btn-disabled'
                    )}
                    onClick={() =>
                      updateParams(
                        option.applyFilter(
                          displayParams
                        ) as PuzzleSearchParams<Search>
                      )
                    }
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </Fragment>
          );
        })}
        <div className="mt-2">Sort by</div>
        <div className="flex gap-4 mt-2 flex-wrap">
          {orderings
            .filter(ordering =>
              searchType === 'public' || searchType === 'published'
                ? ordering.id !== 'created'
                : ordering.id !== 'published'
            )
            .map(ordering => (
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
                  let newParams: PuzzleSearchParams<Search>;
                  if (displayParams.sort === `${ordering.id}-asc`) {
                    newParams = { ...displayParams, sort: undefined };
                  } else if (displayParams.sort === `${ordering.id}-desc`) {
                    newParams = {
                      ...displayParams,
                      sort: `${ordering.id}-asc`,
                    };
                  } else {
                    newParams = {
                      ...displayParams,
                      sort: `${ordering.id}-desc`,
                    };
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
}

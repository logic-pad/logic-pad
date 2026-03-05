import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createLazyFileRoute } from '@tanstack/react-router';
import { memo, useState } from 'react';
import { bidirectionalInfiniteQuery } from '../online/api';
import PuzzleCard from '../online/PuzzleCard';
import Loading from '../components/Loading';
import InfiniteScrollTrigger from '../components/InfiniteScrollTrigger';
import { PuzzleBrief, ResourceStatus } from '../online/data';
import { getPuzzleTypes } from '@logic-pad/core/index';
import ResponsiveLayout from '../components/ResponsiveLayout';

interface RawDevPuzzle {
  id: string;
  difficulty: number;
  puzzleLink: string;
}

interface DevPuzzle extends PuzzleBrief {
  id: string;
  data: string;
}

let devPuzzles: RawDevPuzzle[] | null = null;

const NO_RATING = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

async function fetchDevPuzzles() {
  if (devPuzzles) return devPuzzles;
  const response = (await import('../../../references/dev_puzzles.json')) as {
    default: {
      pid: number;
      difficulty: number;
      puzzleLink: string;
    }[];
  };
  devPuzzles = response.default.map(p => ({
    id: p.pid.toString(),
    difficulty: p.difficulty,
    puzzleLink: p.puzzleLink,
  }));
  return devPuzzles;
}

async function parsePuzzles(rawPuzzles: RawDevPuzzle[]) {
  return (
    await Promise.all(
      rawPuzzles.map(async raw => {
        const data = new URL(raw.puzzleLink).searchParams.get('d');
        if (!data) {
          console.log(`Invalid puzzle link`, raw.puzzleLink);
          return null;
        }
        const puzzle = Serializer.parsePuzzle(
          await Compressor.decompress(data)
        );
        return {
          id: raw.id,
          createdAt: '',
          updatedAt: '',
          title: puzzle.title,
          description: puzzle.description,
          designDifficulty: puzzle.difficulty,
          ratedDifficulty: NO_RATING,
          inSeries: false,
          solveCount: 0,
          loveCount: 0,
          data,
          types: getPuzzleTypes(puzzle.grid),
          width: puzzle.grid.width,
          height: puzzle.grid.height,
          status: ResourceStatus.Private,
          creator: {
            id: '',
            createdAt: '',
            updatedAt: '',
            accessedAt: '',
            solveCount: 0,
            createCount: 0,
            description: '',
            name: puzzle.author,
            title: null as string | null,
            supporter: 0,
          },
        };
      })
    )
  ).filter((p): p is DevPuzzle => !!p);
}

export const Route = createLazyFileRoute('/(local)/_layout/dev/puzzles')({
  component: memo(function DevPuzzles() {
    const [sort, setSort] = useState<
      'pid-asc' | 'pid-desc' | 'difficulty-asc' | 'difficulty-desc'
    >('difficulty-asc');
    const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
      bidirectionalInfiniteQuery(
        ['dev-puzzle', 'search', sort],
        async (cursorBefore, cursorAfter) => {
          const puzzles = await fetchDevPuzzles();
          let sortFunc: (a: RawDevPuzzle, b: RawDevPuzzle) => number;
          switch (sort) {
            case 'pid-asc':
              sortFunc = (a, b) => parseInt(a.id) - parseInt(b.id);
              break;
            case 'pid-desc':
              sortFunc = (a, b) => parseInt(b.id) - parseInt(a.id);
              break;
            case 'difficulty-asc':
              sortFunc = (a, b) => a.difficulty - b.difficulty;
              break;
            case 'difficulty-desc':
              sortFunc = (a, b) => b.difficulty - a.difficulty;
              break;
          }
          let sorted = [...puzzles].sort(sortFunc);
          if (sort.startsWith('difficulty')) {
            sorted = sorted.filter(p => p.difficulty > 0);
          }
          const pageSize = 30;
          let startIndex = 0;
          if (cursorAfter) {
            const index = sorted.findIndex(p => p.id === cursorAfter);
            if (index !== -1) {
              startIndex = index + 1;
            }
          } else if (cursorBefore) {
            const index = sorted.findIndex(p => p.id === cursorBefore);
            if (index !== -1) {
              startIndex = Math.max(0, index - pageSize);
            }
          }
          const page = sorted.slice(startIndex, startIndex + pageSize);
          return {
            total: sorted.length,
            results: await parsePuzzles(page),
          };
        }
      )
    );

    return (
      <ResponsiveLayout>
        <div className="flex gap-4">
          <input
            type="radio"
            name="sort"
            id="pid-asc"
            className="radio"
            checked={sort === 'pid-asc'}
            onChange={() => setSort('pid-asc')}
          />
          <label htmlFor="pid-asc">PID Ascending</label>
          <input
            type="radio"
            name="sort"
            id="pid-desc"
            className="radio"
            checked={sort === 'pid-desc'}
            onChange={() => setSort('pid-desc')}
          />
          <label htmlFor="pid-desc">PID Descending</label>
          <input
            type="radio"
            name="sort"
            id="difficulty-asc"
            className="radio"
            checked={sort === 'difficulty-asc'}
            onChange={() => setSort('difficulty-asc')}
          />
          <label htmlFor="difficulty-asc">Difficulty Ascending</label>
          <input
            type="radio"
            name="sort"
            id="difficulty-desc"
            className="radio"
            checked={sort === 'difficulty-desc'}
            onChange={() => setSort('difficulty-desc')}
          />
          <label htmlFor="difficulty-desc">Difficulty Descending</label>
        </div>

        <div className="divider m-0" />
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-wrap gap-4 justify-center">
            {data?.pages.flatMap(page =>
              page.results.map(puzzle => (
                <PuzzleCard
                  key={puzzle.id}
                  puzzle={puzzle}
                  onClick={() => {
                    const url = new URL(window.location.origin);
                    url.pathname = '/solve';
                    url.searchParams.set('d', puzzle.data);
                    window.open(url.toString(), '_blank');
                  }}
                />
              ))
            )}
          </div>
          {isFetching ? (
            <Loading className="h-fit" />
          ) : hasNextPage ? (
            <InfiniteScrollTrigger
              onLoadMore={async () => await fetchNextPage()}
            />
          ) : null}
        </div>
      </ResponsiveLayout>
    );
  }),
});

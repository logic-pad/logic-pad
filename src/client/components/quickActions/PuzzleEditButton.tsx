import { memo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FaEdit } from 'react-icons/fa';
import { Compressor } from '@logic-pad/core/data/serializer/compressor/allCompressors';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { useAtomValue } from 'jotai';
import { getGridAtom, metadataAtom, solutionAtom } from '../../state/grid.ts';
import { useOnline } from '../../state/online.ts';
import { onlinePuzzleIdAtom } from '../../state/onlinePuzzle.ts';
import { useQuery } from '@tanstack/react-query';
import { puzzleSolveQueryOptions } from '../../routes/_layout.solve.$puzzleId';
import { tip } from '../Tooltip.tsx';

export default memo(function PuzzleEditButton() {
  const navigate = useNavigate();
  const { isOnline, me } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const puzzleQuery = useQuery(puzzleSolveQueryOptions(id));
  const metadata = useAtomValue(metadataAtom);
  const grid = useAtomValue(getGridAtom);
  const solution = useAtomValue(solutionAtom);
  return (
    <button
      className="btn btn-md btn-ghost flex items-center w-fit focus:z-50"
      {...tip(
        puzzleQuery.data?.creator.id === me?.id
          ? 'Edit this puzzle'
          : 'Remix this puzzle',
        'right'
      )}
      onClick={async () => {
        if (
          isOnline &&
          me &&
          puzzleQuery.data &&
          puzzleQuery.data.creator.id === me.id
        ) {
          await navigate({
            to: `/create/${puzzleQuery.data.id}`,
          });
        } else {
          const data = await Compressor.compress(
            Serializer.stringifyPuzzle({ ...metadata, grid, solution })
          );
          await navigate({
            to: '/create',
            search: {
              d: data,
            },
          });
        }
      }}
    >
      <FaEdit size={24} />
    </button>
  );
});

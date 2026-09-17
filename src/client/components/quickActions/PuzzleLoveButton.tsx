import { memo } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useOnline } from '../../state/online.ts';
import { useAtomValue } from 'jotai';
import { onlinePuzzleIdAtom } from '../../state/onlinePuzzle.ts';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { api, queryClient } from '../../online/api';
import Loading from '../Loading';
import toast from 'react-hot-toast';
import { PuzzleFull } from '../../online/data';

const puzzleLoveQueryOptions = (puzzleId: string | null, enabled: boolean) =>
  queryOptions({
    queryKey: ['puzzle', 'love', puzzleId],
    queryFn: () => api.getPuzzleLove(puzzleId!),
    enabled: enabled && !!puzzleId,
  });

export default memo(function PuzzleLoveButton() {
  const { isOnline, me } = useOnline();
  const id = useAtomValue(onlinePuzzleIdAtom);
  const puzzleLove = useQuery(puzzleLoveQueryOptions(id, isOnline && !!me));
  const setPuzzleLove = useMutation({
    mutationKey: ['puzzle', 'love', 'set', id],
    mutationFn: (variables: Parameters<typeof api.setPuzzleLove>) => {
      return api.setPuzzleLove(...variables);
    },
    onMutate: async (variables: Parameters<typeof api.setPuzzleLove>) => {
      await queryClient.cancelQueries({
        queryKey: ['puzzle', 'love', variables[0]],
      });
      const previousLove = queryClient.getQueryData([
        'puzzle',
        'love',
        variables[0],
      ])!;
      queryClient.setQueryData(['puzzle', 'love', variables[0]], {
        loved: variables[1],
      });
      return { previousLove };
    },
    onError(error, variables, context) {
      toast.error(error.message);
      if (context)
        queryClient.setQueryData(
          ['puzzle', 'love', variables[0]],
          context.previousLove
        );
    },
    onSettled(_data, _error, variables) {
      if (
        queryClient.isMutating({
          mutationKey: ['puzzle', 'love', 'set', variables[0]],
        }) === 1
      )
        void queryClient.invalidateQueries({
          queryKey: ['puzzle', 'love', variables[0]],
        });
    },
  });

  if (!isOnline || !me || !id) return null;
  if (puzzleLove.isPending) return <Loading className="w-14" />;
  return (
    <button
      className="tooltip tooltip-info tooltip-right btn btn-md btn-ghost flex items-center w-fit focus:z-50"
      data-tip={
        puzzleLove.data!.loved ? 'Unlove this puzzle' : 'Love this puzzle'
      }
      onClick={async () => {
        const newLove = await setPuzzleLove.mutateAsync([
          id,
          !puzzleLove.data!.loved,
        ]);
        await queryClient.setQueryData(['puzzle', 'love', id], {
          loved: newLove.loved,
        });
        const puzzleBrief = await api.getPuzzleBriefForSolve(id);
        await queryClient.setQueryData(
          ['puzzle', 'solve', id],
          (puzzle: PuzzleFull) => ({
            ...puzzle,
            ...puzzleBrief,
          })
        );
      }}
    >
      {puzzleLove.data!.loved ? (
        <FaHeart size={24} className="text-primary" />
      ) : (
        <FaRegHeart size={24} />
      )}
    </button>
  );
});

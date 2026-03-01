import React, { useImperativeHandle, useMemo, useState } from 'react';
import PuzzleSearchQuery, {
  PuzzleSearchParams,
  SearchType,
} from './PuzzleSearchQuery';
import PuzzleSearchResults from './PuzzleSearchResults';
import { cn } from '../uiHelper';
import { FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';

export interface AddPuzzlesModalProps<Search extends SearchType> {
  ref: React.Ref<{ open: () => void }>;
  searchType: Search;
  modifyParams?: (
    params: PuzzleSearchParams<Search>
  ) => PuzzleSearchParams<Search>;
  onSubmit: (puzzles: string[]) => void;
}

export default function AddPuzzlesModal<Search extends SearchType>({
  ref,
  searchType,
  modifyParams,
  onSubmit,
}: AddPuzzlesModalProps<Search>) {
  const [params, setParams] = useState<PuzzleSearchParams<Search>>({});
  const [open, setOpen] = useState(false);
  const [selectedPuzzles, setSelectedPuzzles] = useState<string[]>([]);
  const finalParams = useMemo(
    () => modifyParams?.(params) ?? params,
    [modifyParams, params]
  );

  useImperativeHandle(ref, () => ({
    open: () => {
      setSelectedPuzzles([]);
      setOpen(true);
    },
  }));

  return (
    <dialog id="addPuzzlesModal" className={cn('modal', open && 'modal-open')}>
      {open && (
        <div className="modal-box flex flex-col h-[90vh] w-full max-w-[calc(320px*3+1rem*2+1rem*2)] md:max-w-[calc(320px*3+1rem*2+3rem*2)] gap-4 *:shrink-0">
          <div className="flex justify-between gap-4 flex-wrap items-center">
            <h3 className="font-semibold text-2xl">
              Add puzzles to collection
            </h3>
            <div className="flex gap-4 items-center">
              <div>{selectedPuzzles.length} puzzles selected</div>
              <button
                className="btn"
                onClick={() => {
                  setSelectedPuzzles([]);
                  setOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className={cn(
                  'btn btn-primary',
                  selectedPuzzles.length === 0 && 'btn-disabled'
                )}
                onClick={() => {
                  onSubmit(selectedPuzzles);
                  setSelectedPuzzles([]);
                  setOpen(false);
                }}
              >
                Add to collection
              </button>
            </div>
          </div>
          <PuzzleSearchQuery
            params={params}
            searchType={searchType}
            onChange={setParams}
          />
          <div className="divider" />
          <PuzzleSearchResults
            params={finalParams}
            searchType={searchType}
            onClick={puzzle => {
              setSelectedPuzzles(selectedPuzzles => {
                if (selectedPuzzles.includes(puzzle.id)) {
                  return selectedPuzzles.filter(id => id !== puzzle.id);
                }
                if (selectedPuzzles.length >= 100) {
                  toast.error('You can select up to 100 puzzles at a time');
                  return selectedPuzzles;
                }
                return [...selectedPuzzles, puzzle.id];
              });
            }}
            puzzleCardChildren={puzzle => (
              <div
                className={cn(
                  'absolute bottom-0 right-0 w-10 h-10 flex justify-center items-center rounded-tl-xl rounded-br-xl',
                  selectedPuzzles.includes(puzzle.id)
                    ? 'bg-accent text-accent-content'
                    : 'bg-base-100 text-base-content'
                )}
              >
                {selectedPuzzles.includes(puzzle.id) ? (
                  <div className="text-xl">
                    {selectedPuzzles.indexOf(puzzle.id) + 1}
                  </div>
                ) : (
                  <FaPlus size={24} />
                )}
              </div>
            )}
          />
          <div className="h-4" />
        </div>
      )}
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setOpen(false)}>close</button>
      </form>
    </dialog>
  );
}

import {
  memo,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import GridData from '@logic-pad/core/data/grid';
import { cn } from '../../../client/uiHelper.ts';
import PuzzleEditorScreen from '../../screens/PuzzleEditorScreen.tsx';
import {
  defaultGrid,
  defaultMetadata,
  getGridAtom,
  setGridAtom,
} from '../../state/grid.ts';
import { useDelta } from 'react-delta-hooks';
import FullScreenModal from '../../components/FullScreenModal.tsx';
import { useAtomValue, useSetAtom } from 'jotai';
import { SyncAtomToRef } from '../../state/stateHelper.tsx';
import { EmbeddedPuzzleScope } from '../../state/scopes/EmbeddedPuzzleScope.tsx';
import { EmbedScope } from '../../state/scopes/EmbedScope.tsx';

export interface GridEditorRef {
  open: (grid: GridData) => void;
}

export interface GridEditorModalProps {
  onChange: (grid: GridData) => void;
  ref?: Ref<GridEditorRef>;
}

const CopyFromMainGridButton = memo(function CopyFromMainGridButton({
  outerGrid,
}: {
  outerGrid: GridData;
}) {
  const setInnerGrid = useSetAtom(setGridAtom);
  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        setInnerGrid(outerGrid);
      }}
    >
      Copy from main grid
    </button>
  );
});

export default memo(function GridEditorModal({
  onChange,
  ref,
}: GridEditorModalProps) {
  const [open, setOpen] = useState(false);
  const [initialGrid, setInitialGrid] = useState<GridData>(defaultGrid);
  const gridRef = useRef<GridData>(defaultGrid);
  // reads the grid of the parent puzzle scope, for "Copy from main grid"
  const outerGrid = useAtomValue(getGridAtom);

  useImperativeHandle(ref, () => ({
    open: (grid: GridData) => {
      setInitialGrid(grid);
      gridRef.current = grid;
      setOpen(true);
    },
  }));

  const openDelta = useDelta(open);
  useEffect(() => {
    if (!openDelta) return;
    if (openDelta.prev && !openDelta.curr) {
      onChange(gridRef.current);
    }
  }, [onChange, openDelta]);

  return (
    <FullScreenModal
      title="Edit grid"
      className={cn('modal', open && 'modal-open')}
      onClose={() => setOpen(false)}
    >
      {open && (
        <EmbedScope
          name="grid-modal"
          features={{
            instructions: false,
            metadata: false,
            checklist: false,
            saveControl: false,
            preview: false,
          }}
        >
          <EmbeddedPuzzleScope
            grid={initialGrid}
            solution={null}
            metadata={defaultMetadata}
          >
            <SyncAtomToRef atom={getGridAtom} ref={gridRef} />
            <PuzzleEditorScreen>
              <CopyFromMainGridButton outerGrid={outerGrid} />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Save and exit
              </button>
            </PuzzleEditorScreen>
          </EmbeddedPuzzleScope>
        </EmbedScope>
      )}
    </FullScreenModal>
  );
});

export const type = undefined;

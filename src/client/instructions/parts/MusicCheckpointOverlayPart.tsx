import { PartPlacement, PartSpec } from './types';
import MusicGridRule, {
  instance as musicGridInstance,
} from '@logic-pad/core/data/rules/musicGridRule';
import { memo, use, useEffect, useMemo, useState } from 'react';
import { FaPlay } from 'react-icons/fa6';
import GridOverlay from '../../grid/GridOverlay';

const instrumentsImport = import('./instruments');

export interface MusicCheckpointOverlayPartProps {
  instruction: MusicGridRule;
}

export default memo(function MusicOverlayPart({
  instruction,
}: MusicCheckpointOverlayPartProps) {
  const instruments = use(instrumentsImport);
  const checkpointLines = useMemo(
    () => instruction.controlLines.filter(line => line.checkpoint),
    [instruction.controlLines]
  );
  const [activeCheckpoint, setActiveCheckpoint] = useState(0);

  useEffect(() => {
    if (!checkpointLines.find(line => line.column === activeCheckpoint)) {
      setActiveCheckpoint(0);
    }
    instruments.playbackState.checkpoint = activeCheckpoint;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpointLines, activeCheckpoint]);

  if (checkpointLines.length === 0) return null;

  return (
    <GridOverlay>
      <div
        className="absolute h-[calc(100%+0.2em)] w-[0.1em] rounded-full bg-secondary -top-[0.2em]"
        style={{ left: `${activeCheckpoint - 0.05}em` }}
      ></div>
      {checkpointLines.map(line => (
        <button
          key={line.column}
          type="button"
          aria-label={`Set checkpoint to column ${line.column}`}
          className="absolute btn btn-circle btn-secondary text-[1em] w-[0.4em] h-[0.4em] min-h-0 -top-[0.4em] pointer-events-auto z-2"
          style={{ left: `${line.column - 0.2}em` }}
          onClick={() => setActiveCheckpoint(line.column)}
        >
          <FaPlay size="0.2em" />
        </button>
      ))}
    </GridOverlay>
  );
});

export const spec: PartSpec = {
  placement: PartPlacement.MainGridOverlay,
  instructionId: musicGridInstance.id,
};

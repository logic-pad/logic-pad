import { memo, RefObject } from 'react';
import { Position } from '@logic-pad/core/data/primitives';
import { Description } from './Description';
import { InsightOverlayHandle } from './InsightOverlay';
import { tilesSyntax } from './insightHelper';

export default memo(function InsightHint({
  cells,
  overlayHandle,
  progress,
  onReveal,
}: {
  cells: Position[];
  overlayHandle: RefObject<InsightOverlayHandle | null>;
  progress: number;
  onReveal: () => void;
}) {
  const waiting = progress < 1;
  return (
    <div className="flex flex-col items-start gap-2 p-2">
      <div className="flex flex-wrap items-center gap-1">
        <Description
          description={`Take a look at ${tilesSyntax(cells)}`}
          overlayHandle={overlayHandle}
        />
      </div>
      <button
        type="button"
        className="btn btn-sm btn-primary self-stretch relative overflow-hidden"
        disabled={waiting}
        onClick={onReveal}
      >
        Reveal insight
        {waiting && (
          <span
            className="absolute bottom-0 left-0 h-[2px] bg-primary"
            style={{ width: `${progress * 100}%` }}
          />
        )}
      </button>
    </div>
  );
});

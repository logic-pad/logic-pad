import { memo, useRef, useState } from 'react';
import InsightSolver from '@logic-pad/core/data/solver/insight/insightSolver';
import { ProofNode } from '@logic-pad/core/data/solver/insight/types/proof';
import { Position } from '@logic-pad/core/data/primitives';
import { useAtomValue, useSetAtom } from 'jotai';
import { cn } from '../../uiHelper';
import { getGridAtom, setGridAtom } from '../../state/grid';
import { useSettings } from '../../state/settings';
import InsightHeader from './InsightHeader';
import InsightHint from './InsightHint';
import { ProofList } from './Description';
import InsightOverlay, { InsightOverlayHandle } from './InsightOverlay';
import {
  Deduction,
  Status,
  deductedCells,
  useCountdown,
} from './insightHelper';

const USE_COOLDOWN = 200;
const REVEAL_COOLDOWN = 5000;

const solver = new InsightSolver();

interface PendingInsight {
  cells: Deduction[];
  proofs: ProofNode[];
}

export default memo(function GridInsight() {
  const [gridInsights] = useSettings('gridInsight');
  const grid = useAtomValue(getGridAtom);
  const setGrid = useSetAtom(setGridAtom);
  const [status, setStatus] = useState<Status>(null);
  const {
    progress: cooldownProgress,
    start: startCooldown,
    stop: stopCooldown,
  } = useCountdown(USE_COOLDOWN, true);
  const {
    progress: revealProgress,
    start: startReveal,
    stop: stopReveal,
  } = useCountdown(REVEAL_COOLDOWN);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [solveHandle, setSolveHandle] = useState<AbortController | null>(null);
  const [result, setResult] = useState<ProofNode[] | string | null>(null);
  const [pending, setPending] = useState<PendingInsight | null>(null);
  const [hint, setHint] = useState<Position[] | null>(null);
  const overlayRef = useRef<InsightOverlayHandle>(null);
  const speculating = useRef(false);
  const run = useRef(0);

  const coolingDown = cooldownProgress < 1;
  const panelOpen = status !== null;

  const clearResult = () => {
    setResult(null);
    setPending(null);
    setHint(null);
    setProgress(0);
    setProgressLabel(null);
    stopReveal();
    overlayRef.current?.setPositions(null, 'info');
  };

  const closePanel = (armCooldown: boolean) => {
    setStatus(null);
    clearResult();
    if (armCooldown) {
      startCooldown();
    } else {
      stopCooldown();
    }
  };

  const startSolve = async () => {
    const currentRun = ++run.current;
    const before = grid;
    setStatus('solving');
    clearResult();
    const controller = new AbortController();
    setSolveHandle(controller);
    speculating.current = false;
    try {
      const response = await solver.process(before, {
        completeSolve: false,
        reportProof: true,
        abortSignal: controller.signal,
        onProgress: (value, total, phase) => {
          if (currentRun !== run.current) return;
          if (phase === 'speculation') {
            speculating.current = true;
          } else if (speculating.current) {
            return;
          }
          setProgress(total > 0 ? (value / total) * 100 : 0);
          setProgressLabel(
            phase === 'speculation' ? `${value}/${total} tiles checked` : null
          );
        },
      });
      if (currentRun !== run.current) return;
      setSolveHandle(null);
      setProgress(100);
      if (response instanceof Error) {
        setResult(response.message);
        setStatus('unsolvable');
      } else if (response.grid === undefined) {
        setStatus('unavailable');
      } else if (response.grid === null) {
        setStatus('unsolvable');
      } else {
        const cells = deductedCells(before, response.grid);
        if (cells.length === 0) {
          setStatus('unavailable');
        } else {
          setPending({ cells, proofs: response.proofs ?? [] });
          setHint(cells);
          setStatus('found');
          startReveal();
        }
      }
    } catch (ex) {
      console.error(ex);
      if (currentRun !== run.current) return;
      setSolveHandle(null);
      setStatus('error');
    }
  };

  const revealInsight = () => {
    if (!pending || revealProgress < 1) return;
    const cells = pending.cells;
    setGrid(current => {
      let updated = current;
      for (const cell of cells) {
        updated = updated.copyWith(
          {
            tiles: updated.setTile(cell.x, cell.y, t =>
              t.withColor(cell.color)
            ),
          },
          false
        );
      }
      return updated;
    });
    setResult(pending.proofs);
    setPending(null);
    setHint(null);
    stopReveal();
    setStatus('revealed');
  };

  const onAction = () => {
    if (status === 'solving') {
      ++run.current;
      solveHandle?.abort();
      setSolveHandle(null);
      closePanel(false);
      return;
    }
    if (panelOpen) {
      closePanel(true);
      return;
    }
    if (coolingDown) return;
    void startSolve();
  };

  if (!gridInsights) return null;

  return (
    <div
      className={cn(
        'grow-0 shrink-0 flex flex-col items-stretch group transition-colors',
        status ? 'bg-primary/10' : 'hover:bg-primary/10'
      )}
    >
      <InsightHeader
        status={status}
        coolingDown={coolingDown}
        cooldownProgress={cooldownProgress}
        solveProgress={progress}
        progressLabel={progressLabel}
        onAction={onAction}
      />
      {status === 'found' && hint && (
        <InsightHint
          cells={hint}
          overlayHandle={overlayRef}
          progress={revealProgress}
          onReveal={revealInsight}
        />
      )}
      {result !== null && (
        <>
          <div className="max-h-96 overflow-y-auto">
            <ProofList result={result} overlayHandle={overlayRef} />
          </div>
          <div className="divider my-0 h-1" />
        </>
      )}
      <InsightOverlay ref={overlayRef} />
    </div>
  );
});

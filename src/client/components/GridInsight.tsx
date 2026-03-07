import {
  memo,
  ReactNode,
  Ref,
  RefObject,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useGrid } from '../contexts/GridContext';
import InsightSolver from '@logic-pad/core/data/solver/insight/insightSolver';
import { IoIosEye } from 'react-icons/io';
import { cn } from '../uiHelper';
import { IoBan } from 'react-icons/io5';
import { ProofNode } from '@logic-pad/core/data/solver/insight/types/proof';
import { Color, Position } from '@logic-pad/core/data/primitives';
import { useTheme } from '../contexts/ThemeContext';
import OutlineOverlay from '../grid/OutlineOverlay';
import InstructionPartPortal from '../instructions/InstructionPartPortal';
import { PartPlacement } from '../instructions/parts/types';
import { r } from 'readable-regexp';

const solver = new InsightSolver();

type Status =
  | 'solving'
  | 'success'
  | 'error'
  | 'unsolvable'
  | 'unavailable'
  | null;

function statusToText(status: Status): string {
  switch (status) {
    case 'solving':
      return 'Solving...';
    case 'success':
      return 'Insight available';
    case 'error':
      return 'Unexpected error';
    case 'unsolvable':
      return 'Puzzle is unsolvable';
    case 'unavailable':
      return 'No insights available';
    default:
      return 'Get insights';
  }
}

function HighlightButton({
  type,
  positions,
  overlayHandle,
}: {
  type: 'region' | 'cell';
  positions: Position[];
  overlayHandle: RefObject<InsightOverlayHandle | null>;
}) {
  const { grid } = useGrid();
  const text = useMemo(() => {
    if (positions.length === 1) {
      return `${positions[0].x},${positions[0].y}`;
    } else if (positions.length < 3) {
      return positions.map(p => `${p.x},${p.y}`).join('\u3000');
    } else {
      return `${positions
        .slice(0, 2)
        .map(p => `${p.x},${p.y}`)
        .join('\u3000')}...`;
    }
  }, [positions]);
  return (
    <button
      className={cn(
        'btn btn-xs inline px-1.5 py-0.5 btn-neutral border-0 border-b',
        type === 'region'
          ? 'bg-info/10 border-info'
          : 'bg-accent/10 border-accent'
      )}
      onClick={() => {
        const finalPositions = [];
        for (const position of positions) {
          const tile = grid.getTile(position.x, position.y);
          if (type === 'cell' || tile.color === Color.Gray) {
            finalPositions.push(position);
          } else {
            grid.iterateArea(
              position,
              t => t.color === tile.color,
              (_, x, y) => {
                finalPositions.push({ x, y });
              }
            );
          }
        }
        overlayHandle.current?.setPositions(
          finalPositions,
          type === 'region' ? 'info' : 'accent'
        );
      }}
    >
      {text}
    </button>
  );
}

const COORDINATES = r.oneOrMore.charIn`0-9`.exactly`,`.oneOrMore.charIn`0-9`;
const COORDINATE_LIST = r
  .zeroOrMore(r.match(COORDINATES).exactly`;`)
  .match(COORDINATES);

const regionRegex = r.lineStart.exactly`[`.capture(COORDINATE_LIST)
  .exactly`]`.toRegExp();
const cellRegex = r.lineStart.exactly`(`.capture(COORDINATE_LIST)
  .exactly`)`.toRegExp();
const bothRegex = r.capture
  .oneOf(
    r.exactly`[`.match(COORDINATE_LIST).exactly`]`,
    r.exactly`(`.match(COORDINATE_LIST).exactly`)`
  )
  .toRegExp('g');

function Description({
  description,
  overlayHandle,
}: {
  description: string;
  overlayHandle: RefObject<InsightOverlayHandle | null>;
}) {
  const parts = description.split(bothRegex);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(regionRegex);
        if (match) {
          const positions = match[1].split(';').map(coord => {
            const [x, y] = coord.split(',').map(Number);
            return { x, y };
          });
          return (
            <HighlightButton
              key={index}
              type="region"
              positions={positions}
              overlayHandle={overlayHandle}
            />
          );
        }
        const match2 = part.match(cellRegex);
        if (match2) {
          const positions = match2[1].split(';').map(coord => {
            const [x, y] = coord.split(',').map(Number);
            return { x, y };
          });
          return (
            <HighlightButton
              key={index}
              type="cell"
              positions={positions}
              overlayHandle={overlayHandle}
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function proofToNode(
  proof: ProofNode,
  overlayHandle: RefObject<InsightOverlayHandle | null>
): ReactNode {
  if (proof.children.size === 0) {
    return (
      <li key={proof.description}>
        <a>
          <span>
            <Description
              description={proof.description}
              overlayHandle={overlayHandle}
            />
          </span>
        </a>
      </li>
    );
  } else {
    return (
      <li key={proof.description}>
        <details open>
          <summary>
            <span>
              <Description
                description={proof.description}
                overlayHandle={overlayHandle}
              />
            </span>
          </summary>
          <ul>
            {Array.from(proof.children).map(child =>
              proofToNode(child, overlayHandle)
            )}
          </ul>
        </details>
      </li>
    );
  }
}

const InsightOverlayRenderer = memo(function InsightOverlay({
  positions,
  color,
}: {
  positions: Position[] | null;
  color: 'accent' | 'info';
}) {
  const { theme } = useTheme();
  const { grid } = useGrid();
  const accentColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-accent')!)
        .color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );
  const infoColor = useMemo(
    () =>
      window.getComputedStyle(document.getElementById('color-ref-info')!).color,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  const positionsArray = useMemo(
    () => (positions ? [positions] : null),
    [positions]
  );

  if (positionsArray === null) return null;
  return (
    <OutlineOverlay
      positions={positionsArray}
      width={grid.width}
      height={grid.height}
      color={color === 'accent' ? accentColor : infoColor}
    ></OutlineOverlay>
  );
});

interface InsightOverlayHandle {
  setPositions: (
    positions: Position[] | null,
    color: 'accent' | 'info'
  ) => void;
}

const InsightOverlay = memo(function InsightOverlay({
  ref,
}: {
  ref: Ref<InsightOverlayHandle>;
}) {
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [color, setColor] = useState<'accent' | 'info'>('accent');
  useImperativeHandle(
    ref,
    () => ({
      setPositions: (
        positions: Position[] | null,
        color: 'accent' | 'info'
      ) => {
        setPositions(positions);
        setColor(color);
      },
    }),
    [setPositions]
  );
  return (
    <InstructionPartPortal placement={PartPlacement.MainGridOverlay}>
      <InsightOverlayRenderer positions={positions} color={color} />
    </InstructionPartPortal>
  );
});

export default memo(function GridInsight() {
  const { grid, setGrid } = useGrid();
  const [status, setStatus] = useState<Status>(null);
  const [progress, setProgress] = useState<number>(0);
  const [solveHandle, setSolveHandle] = useState<AbortController | null>(null);
  const [result, setResult] = useState<ProofNode[] | string | null>(null);
  const overlayRef = useRef<InsightOverlayHandle>(null);

  const resultNode = useMemo(() => {
    if (typeof result === 'string') {
      return <span>{result}</span>;
    } else if (result) {
      return (
        <ul className="menu">
          {result.map(proof => proofToNode(proof, overlayRef))}
        </ul>
      );
    }
  }, [result]);

  return (
    <div
      className={cn(
        'grow-0 shrink-0 flex flex-col items-stretch group transition-colors',
        status ? 'bg-primary/10' : ' hover:bg-primary/10'
      )}
    >
      {resultNode && (
        <>
          <div className="max-h-96 overflow-y-auto">{resultNode}</div>
          <div className="divider my-0 h-1" />
        </>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost text-lg w-fit"
          onClick={async () => {
            if (solveHandle) {
              solveHandle.abort();
              setSolveHandle(null);
              setStatus(null);
              setProgress(0);
              setResult(null);
              overlayRef.current?.setPositions(null, 'info');
              return;
            }
            setStatus('solving');
            const controller = new AbortController();
            setSolveHandle(controller);
            setProgress(0);
            setResult(null);
            overlayRef.current?.setPositions(null, 'info');
            try {
              const result = await solver.process(grid, {
                completeSolve: false,
                reportProof: true,
                abortSignal: controller.signal,
                onProgress: (progress, total) => {
                  setProgress((progress / total) * 100);
                },
              });
              if (result instanceof Error) {
                setResult(result.message);
                setStatus('unsolvable');
              } else if (result.grid === undefined) {
                setStatus('unavailable');
              } else if (result.grid === null) {
                setStatus('unsolvable');
              } else {
                setGrid(result.grid);
                setResult(result.proofs ?? null);
                setStatus('success');
              }
            } catch (ex) {
              console.error(ex);
              setStatus('error');
            }
            setSolveHandle(null);
            setProgress(100);
          }}
        >
          {solveHandle ? <IoBan size={28} /> : <IoIosEye size={28} />}
        </button>
        <div
          className={cn(
            !status && 'group-hover:opacity-100 opacity-0 transition-opacity'
          )}
        >
          {statusToText(status)}
        </div>
      </div>
      <progress
        className={cn(
          'progress h-[4px]',
          progress < 100
            ? 'progress-primary'
            : status === 'success'
              ? 'progress-success'
              : 'progress-error',
          !status && 'group-hover:opacity-100 opacity-0 transition-opacity'
        )}
        value={progress}
        max="100"
      ></progress>
      <InsightOverlay ref={overlayRef} />
    </div>
  );
});

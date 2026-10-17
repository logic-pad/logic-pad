import { memo, ReactNode, RefObject, useMemo } from 'react';
import { ProofNode } from '@logic-pad/core/data/solver/insight/types/proof';
import { Color, Position } from '@logic-pad/core/data/primitives';
import { r } from 'readable-regexp';
import { useAtomValue } from 'jotai';
import { cn } from '../../uiHelper';
import { getGridAtom } from '../../state/grid';
import { InsightOverlayHandle } from './InsightOverlay';

function HighlightButton({
  type,
  positions,
  overlayHandle,
}: {
  type: 'region' | 'cell';
  positions: Position[];
  overlayHandle: RefObject<InsightOverlayHandle | null>;
}) {
  const grid = useAtomValue(getGridAtom);
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

export function Description({
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

export const ProofList = memo(function ProofList({
  result,
  overlayHandle,
}: {
  result: ProofNode[] | string;
  overlayHandle: RefObject<InsightOverlayHandle | null>;
}) {
  if (typeof result === 'string') {
    return <span>{result}</span>;
  }
  return (
    <ul className="menu">
      {result.map(proof => proofToNode(proof, overlayHandle))}
    </ul>
  );
});

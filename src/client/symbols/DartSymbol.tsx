import { memo } from 'react';
import { cn } from '../../client/uiHelper.ts';
import DartSymbolData from '@logic-pad/core/data/symbols/dartSymbol';
import { Orientation } from '@logic-pad/core/data/primitives';
import {
  HiMiniArrowLongDown,
  HiMiniArrowLongLeft,
  HiMiniArrowLongRight,
  HiMiniArrowLongUp,
} from 'react-icons/hi2';

export interface DartProps {
  textClass: string;
  symbol: DartSymbolData;
}

const orientations = {
  [Orientation.Up]: {
    arrowIcon: HiMiniArrowLongUp,
    arrowStitch: {
      right: 0,
      marginLeft: 'auto',
    },
    numberDisplacement: {
      transform: 'translateX(-0.20em)',
    },
  },
  [Orientation.Left]: {
    arrowIcon: HiMiniArrowLongLeft,
    arrowStitch: {
      top: 0,
      marginBottom: 'auto',
    },
    numberDisplacement: {
      transform: 'translateY(0.20em)',
    },
  },
  [Orientation.Down]: {
    arrowIcon: HiMiniArrowLongDown,
    arrowStitch: {
      left: 0,
      marginRight: 'auto',
    },
    numberDisplacement: {
      transform: 'translateX(0.20em)',
    },
  },
  [Orientation.Right]: {
    arrowIcon: HiMiniArrowLongRight,
    arrowStitch: {
      bottom: 0,
      marginTop: 'auto',
    },
    numberDisplacement: {
      transform: 'translateY(-0.20em)',
    },
  },
  [Orientation.UpLeft]: {
    arrowIcon: HiMiniArrowLongUp,
    arrowStitch: {
      right: '0.1em',
      top: '0.1em',
      transform: 'rotate(-45deg)',
      fontSize: '0.9em',
    },
    numberDisplacement: {
      transform: 'translate(-0.20em, 0.20em)',
    },
  },
  [Orientation.UpRight]: {
    arrowIcon: HiMiniArrowLongRight,
    arrowStitch: {
      bottom: '0.1em',
      right: '0.1em',
      transform: 'rotate(-45deg)',
      fontSize: '0.9em',
    },
    numberDisplacement: {
      transform: 'translate(-0.20em, -0.20em)',
    },
  },
  [Orientation.DownLeft]: {
    arrowIcon: HiMiniArrowLongDown,
    arrowStitch: {
      left: '0.1em',
      top: '0.1em',
      transform: 'rotate(45deg)',
      fontSize: '0.9em',
    },
    numberDisplacement: {
      transform: 'translate(0.20em, 0.20em)',
    },
  },
  [Orientation.DownRight]: {
    arrowIcon: HiMiniArrowLongDown,
    arrowStitch: {
      left: '0.1em',
      bottom: '0.1em',
      transform: 'rotate(-45deg)',
      fontSize: '0.9em',
    },
    numberDisplacement: {
      transform: 'translate(0.20em, -0.20em)',
    },
  },
};

// million-ignore
export default memo(function DartSymbol({ textClass, symbol }: DartProps) {
  const direction = symbol.orientation;
  const Icon = orientations[direction].arrowIcon;
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      <span
        className={cn('absolute text-[0.55em]', textClass)}
        style={orientations[direction].numberDisplacement}
        aria-hidden="true"
      >
        {symbol.number}
      </span>
      <div
        className={cn('absolute', textClass, '-m-[0.10em]')}
        style={orientations[direction].arrowStitch}
        aria-hidden="true"
      >
        <Icon size="0.7em" />
      </div>
      <span className="sr-only">
        {`Dart facing ${symbol.orientation} with number ${symbol.number} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'dart';

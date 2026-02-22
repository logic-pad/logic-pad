import { memo } from 'react';
import { cn } from '../uiHelper.ts';
import EveryLetterSymbolData from '@logic-pad/core/data/symbols/everyLetterSymbol';

export interface EveryLetterProps {
  textClass: string;
  symbol: EveryLetterSymbolData;
}

export default memo(function EveryLetterSymbol({
  textClass,
  symbol,
}: EveryLetterProps) {
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      <span
        className={cn(
          'absolute m-auto text-[0.75em] x-text-outline',
          symbol.letter.length === 0 && 'opacity-50',
          textClass
        )}
        aria-hidden="true"
      >
        {symbol.letter.padStart(1, '?')}
      </span>
      <span className="sr-only">
        {`Hollow Letter ${symbol.letter} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'every_letter';

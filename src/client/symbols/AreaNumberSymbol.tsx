import { memo } from 'react';
import { cn } from '../../client/uiHelper.ts';
import AreaNumberSymbolData from '@logic-pad/core/data/symbols/areaNumberSymbol';

export interface AreaNumberProps {
  textClass: string;
  symbol: AreaNumberSymbolData;
}

export default memo(function AreaNumberSymbol({
  textClass,
  symbol,
}: AreaNumberProps) {
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      <span
        className={cn(
          'absolute m-auto',
          textClass,
          String(symbol.number).length >= 3 ? 'text-[0.55em]' : 'text-[0.75em]'
        )}
        aria-hidden="true"
      >
        {symbol.number}
      </span>
      <span className="sr-only">
        {`Area number ${symbol.number} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'number';

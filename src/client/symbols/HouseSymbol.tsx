import { memo } from 'react';
import { cn } from '../uiHelper.ts';
import HouseSymbolData from '@logic-pad/core/data/symbols/houseSymbol';
import { BsHouse } from 'react-icons/bs';

export interface HouseProps {
  textClass: string;
  symbol: HouseSymbolData;
}

export default memo(function HouseSymbol({ textClass, symbol }: HouseProps) {
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      <span
        className={cn('absolute m-auto text-[0.75em]', textClass)}
        aria-hidden="true"
      >
        <BsHouse />
      </span>
      <span
        className={cn(
          'absolute m-auto text-[0.4em] translate-y-[0.15em]',
          textClass
        )}
        aria-hidden="true"
      >
        {symbol.number}
      </span>
      <span className="sr-only">
        {`House number ${symbol.number} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'house';

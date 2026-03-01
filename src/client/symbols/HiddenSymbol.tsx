import { memo } from 'react';
import { cn } from '../uiHelper';
import HiddenSymbolData from '@logic-pad/core/data/symbols/hiddenSymbol';

export interface LetterProps {
  textClass: string;
  symbol: HiddenSymbolData;
}

export default memo(function LetterSymbol({ symbol, textClass }: LetterProps) {
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none opacity-30',
        textClass
      )}
    >
      <span
        className={cn('absolute m-auto text-[0.75em]', textClass)}
        aria-hidden="true"
      >
        {/* MdHideSource */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          enableBackground="new 0 0 24 24"
          viewBox="0 0 24 24"
          width="1em"
          height="1em"
          fill="currentColor"
        >
          <g>
            <path d="M0,0h24v24H0V0z" fill="none" />
          </g>
          <g>
            <path d="M2.81,2.81L1.39,4.22l2.27,2.27C2.61,8.07,2,9.96,2,12c0,5.52,4.48,10,10,10c2.04,0,3.93-0.61,5.51-1.66l2.27,2.27 l1.41-1.41L2.81,2.81z M12,20c-4.41,0-8-3.59-8-8c0-1.48,0.41-2.86,1.12-4.06l10.94,10.94C14.86,19.59,13.48,20,12,20z M7.94,5.12 L6.49,3.66C8.07,2.61,9.96,2,12,2c5.52,0,10,4.48,10,10c0,2.04-0.61,3.93-1.66,5.51l-1.46-1.46C19.59,14.86,20,13.48,20,12 c0-4.41-3.59-8-8-8C10.52,4,9.14,4.41,7.94,5.12z" />
          </g>
        </svg>
      </span>
      <span className="sr-only">
        {`Hidden symbol at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'hidden';

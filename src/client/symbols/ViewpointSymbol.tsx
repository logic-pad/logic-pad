import { memo } from 'react';
import { cn } from '../../client/uiHelper.ts';
import ViewpointSymbolData from '@logic-pad/core/data/symbols/viewpointSymbol';

export interface ViewpointProps {
  textClass: string;
  symbol: ViewpointSymbolData;
}

export default memo(function ViewpointSymbol({
  textClass,
  symbol,
}: ViewpointProps) {
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        className="absolute m-auto"
        aria-hidden="true"
      >
        <path
          d="M 205.892 393.343 L 250 437.45 L 294.108 393.343 C 297.427 390.023 302.809 390.023 306.128 393.343 C 309.448 396.662 309.448 402.044 306.128 405.363 L 256.01 455.481 C 252.691 458.801 247.309 458.801 243.99 455.481 L 193.872 405.363 C 190.552 402.044 190.552 396.662 193.872 393.343 C 197.191 390.023 202.573 390.023 205.892 393.343 Z M 106.657 205.892 L 62.55 250 L 106.657 294.108 C 109.977 297.427 109.977 302.809 106.657 306.128 C 103.338 309.448 97.956 309.448 94.637 306.128 L 44.519 256.01 C 41.199 252.691 41.199 247.309 44.519 243.99 L 94.637 193.872 C 97.956 190.552 103.338 190.552 106.657 193.872 C 109.977 197.191 109.977 202.573 106.657 205.892 Z M 393.343 294.108 L 437.45 250 L 393.343 205.892 C 390.023 202.573 390.023 197.191 393.343 193.872 C 396.662 190.552 402.044 190.552 405.363 193.872 L 455.481 243.99 C 458.801 247.309 458.801 252.691 455.481 256.01 L 405.363 306.128 C 402.044 309.448 396.662 309.448 393.343 306.128 C 390.023 302.809 390.023 297.427 393.343 294.108 Z M 294.108 106.657 L 250 62.55 L 205.892 106.657 C 202.573 109.977 197.191 109.977 193.872 106.657 C 190.552 103.338 190.552 97.956 193.872 94.637 L 243.99 44.519 C 247.309 41.199 252.691 41.199 256.01 44.519 L 306.128 94.637 C 309.448 97.956 309.448 103.338 306.128 106.657 C 302.809 109.977 297.427 109.977 294.108 106.657 Z"
          fill="currentColor"
        ></path>
      </svg>
      <span
        className={cn('absolute m-auto text-[0.6em]', textClass)}
        aria-hidden="true"
      >
        {symbol.number}
      </span>
      <span className="sr-only">
        {`Viewpoint number ${symbol.number} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'viewpoint';

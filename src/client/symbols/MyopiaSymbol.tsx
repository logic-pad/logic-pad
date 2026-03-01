import { memo } from 'react';
import { cn } from '../../client/uiHelper.ts';
import MyopiaSymbolData from '@logic-pad/core/data/symbols/myopiaSymbol';
import {
  FaLongArrowAltUp,
  FaLongArrowAltDown,
  FaLongArrowAltLeft,
  FaLongArrowAltRight,
} from 'react-icons/fa';
import { ORIENTATIONS } from '@logic-pad/core/data/primitives';
import { RiCheckboxBlankFill } from 'react-icons/ri';
import {
  TbChevronDownLeft,
  TbChevronDownRight,
  TbChevronUpLeft,
  TbChevronUpRight,
} from 'react-icons/tb';

export interface MyopiaProps {
  textClass: string;
  symbol: MyopiaSymbolData;
}

export default memo(function MyopiaSymbol({ textClass, symbol }: MyopiaProps) {
  return (
    <div
      className={cn(
        'absolute flex justify-center items-center w-full h-full pointer-events-none',
        textClass
      )}
    >
      {symbol.directions.up && (
        <div
          key="up"
          className="absolute mx-auto top-[0.065em] mb-auto"
          aria-hidden="true"
        >
          <FaLongArrowAltUp size={'0.5em'} />
        </div>
      )}
      {symbol.directions.down && (
        <div
          key="down"
          className="absolute mx-auto bottom-[0.065em] mt-auto"
          aria-hidden="true"
        >
          <FaLongArrowAltDown size={'0.5em'} />
        </div>
      )}
      {symbol.directions.left && (
        <div
          key="left"
          className="absolute my-auto left-[0.065em] mr-auto"
          aria-hidden="true"
        >
          <FaLongArrowAltLeft size={'0.5em'} />
        </div>
      )}
      {symbol.directions.right && (
        <div
          key="right"
          className="absolute my-auto right-[0.065em] ml-auto"
          aria-hidden="true"
        >
          <FaLongArrowAltRight size={'0.5em'} />
        </div>
      )}
      {symbol.directions['up-left'] ? (
        <div
          key="up-left"
          className="absolute top-[0.12em] left-[0.12em]"
          aria-hidden="true"
        >
          <FaLongArrowAltLeft size={'0.5em'} className="rotate-45" />
        </div>
      ) : (
        symbol.diagonals && (
          <div
            key="up-left"
            className="absolute top-[0.12em] left-[0.12em]"
            aria-hidden="true"
          >
            <TbChevronUpLeft size={'0.3em'} className="opacity-50" />
          </div>
        )
      )}
      {symbol.directions['up-right'] ? (
        <div
          key="up-right"
          className="absolute top-[0.12em] right-[0.12em]"
          aria-hidden="true"
        >
          <FaLongArrowAltUp size={'0.5em'} className="rotate-45" />
        </div>
      ) : (
        symbol.diagonals && (
          <div
            key="up-right"
            className="absolute top-[0.12em] right-[0.12em]"
            aria-hidden="true"
          >
            <TbChevronUpRight size={'0.3em'} className="opacity-50" />
          </div>
        )
      )}
      {symbol.directions['down-left'] ? (
        <div
          key="down-left"
          className="absolute bottom-[0.12em] left-[0.12em]"
          aria-hidden="true"
        >
          <FaLongArrowAltDown size={'0.5em'} className="rotate-45" />
        </div>
      ) : (
        symbol.diagonals && (
          <div
            key="down-left"
            className="absolute bottom-[0.12em] left-[0.12em]"
            aria-hidden="true"
          >
            <TbChevronDownLeft size={'0.3em'} className="opacity-50" />
          </div>
        )
      )}
      {symbol.directions['down-right'] ? (
        <div
          key="down-right"
          className="absolute bottom-[0.12em] right-[0.12em]"
          aria-hidden="true"
        >
          <FaLongArrowAltRight size={'0.5em'} className="rotate-45" />
        </div>
      ) : (
        symbol.diagonals && (
          <div
            key="down-right"
            className="absolute bottom-[0.12em] right-[0.12em]"
            aria-hidden="true"
          >
            <TbChevronDownRight size={'0.3em'} className="opacity-50" />
          </div>
        )
      )}
      {ORIENTATIONS.every(d => !symbol.directions[d]) && (
        <div key="right" className="absolute m-auto" aria-hidden="true">
          <RiCheckboxBlankFill size={'0.1em'} />
        </div>
      )}
      <span className="sr-only">
        {`Myopia symbol facing ${ORIENTATIONS.filter(d => symbol.directions[d]).join(' ')} at (${symbol.x}, ${symbol.y})`}
      </span>
    </div>
  );
});

export const id = 'myopia';

import { memo, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import mouseContext from '../grid/MouseContext';
import { useAtomValue, useSetAtom } from 'jotai';
import { scaleAtom } from '../state/display.ts';
import { getSetting } from '../state/settings.ts';
import { tip } from './Tooltip.tsx';

export default memo(function TouchControls() {
  const [inverted, setInverted] = useState(
    getSetting('flipPrimaryMouseButton')
  );
  const scale = useAtomValue(scaleAtom);
  const setScale = useSetAtom(scaleAtom);
  const isXl = useMediaQuery({ minWidth: 1280 });
  const onSwitch = () => {
    setInverted(i => {
      const newValue = !i;
      mouseContext.setInverted(newValue);
      return newValue;
    });
  };
  return (
    <div className="flex shrink-0 items-center shadow-xl rounded-box bg-base-100 text-base-content fixed bottom-16 z-40 left-2 right-2 xl:static xl:shadow-md">
      <div className="flex flex-1" {...tip('Resize grid')}>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.2}
          value={Math.log2(scale)}
          onChange={e => setScale(2 ** Number(e.currentTarget.value))}
          className="range w-full m-2"
        />
      </div>
      <div
        className="flex h-10"
        {...tip('Toggle primary color', isXl ? 'top' : 'left')}
      >
        <label className="swap swap-flip text-2xl xl:text-lg h-fit xl:h-auto shadow-xl xl:shadow-xs">
          <input type="checkbox" checked={inverted} onChange={onSwitch} />
          <div className="swap-on bg-white text-black text-center flex justify-center items-center p-2 px-4 rounded-box w-24 h-24 xl:w-auto xl:h-10">
            W
          </div>
          <div className="swap-off bg-black text-white text-center flex justify-center items-center rounded-box h-24 w-24 xl:w-auto xl:h-10">
            B
          </div>
        </label>
      </div>
    </div>
  );
});

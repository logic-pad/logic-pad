import { memo, useState } from 'react';
import mouseContext from '../grid/MouseContext';
import { useDisplay } from '../contexts/DisplayContext.tsx';
import { settingsStore } from '../contexts/SettingsContext.tsx';

export default memo(function TouchControls() {
  const [inverted, setInverted] = useState(
    settingsStore.get('flipPrimaryMouseButton')
  );
  const { scale, setScale } = useDisplay();
  const onSwitch = () => {
    setInverted(i => {
      const newValue = !i;
      mouseContext.setInverted(newValue);
      return newValue;
    });
  };
  return (
    <div className="flex shrink-0 items-center shadow-xl rounded-box bg-base-100 text-base-content fixed bottom-16 z-40 left-2 right-2 xl:static xl:shadow-md">
      <div
        className="tooltip tooltip-top flex tooltip-info flex-1"
        data-tip="Resize grid"
      >
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
        className="tooltip tooltip-left xl:tooltip-top flex tooltip-info h-10"
        data-tip="Toggle primary color"
      >
        <label className="swap swap-flip text-2xl xl:text-lg h-fit xl:h-auto shadow-xl xl:shadow-xs">
          <input type="checkbox" checked={inverted} onChange={onSwitch} />
          <div className="swap-on bg-white text-black text-center flex justify-center items-center p-2 px-4 rounded-box w-24 h-24 xl:w-auto xl:h-10">
            W
          </div>
          <div className="swap-off bg-black text-white text-center flex justify-center items-center p-2 px-4 rounded-box h-24 w-24 xl:w-auto xl:h-10">
            B
          </div>
        </label>
      </div>
    </div>
  );
});

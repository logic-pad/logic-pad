import { memo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export default memo(function SfxVolumeSlider() {
  const [sfxVolume, setSfxVolume] = useSettings('sfxVolume');
  return (
    <div
      className="tooltip tooltip-info tooltip-bottom"
      data-tip="Adjust the volume of sound effects"
    >
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">SFX Volume</span>
          <input
            type="range"
            className="range range-xs w-32"
            min={0}
            max={2}
            step={0.05}
            value={sfxVolume}
            onChange={e => setSfxVolume(parseFloat(e.currentTarget.value))}
          />
        </label>
      </fieldset>
    </div>
  );
});

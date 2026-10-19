import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function SfxVolumeSlider() {
  const { t } = useLingui();
  const [sfxVolume, setSfxVolume] = useSettings('sfxVolume');
  return (
    <div {...tip(t`Adjust the volume of sound effects`, 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">{t`SFX Volume`}</span>
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

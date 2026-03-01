import { memo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export default memo(function PrimaryMouseButtonToggle() {
  const [flippedPrimaryButton, setFlippedPrimaryButton] = useSettings(
    'flipPrimaryMouseButton'
  );
  return (
    <div
      className="tooltip tooltip-info tooltip-bottom"
      data-tip="Whether to use left click for light tiles (Reload to take effect)"
    >
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">Flip mouse buttons by default</span>
          <input
            type="checkbox"
            className="toggle"
            checked={flippedPrimaryButton}
            onChange={e => setFlippedPrimaryButton(e.currentTarget.checked)}
          />
        </label>
      </fieldset>
    </div>
  );
});

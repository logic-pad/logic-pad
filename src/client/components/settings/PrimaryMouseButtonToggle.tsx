import { memo } from 'react';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function PrimaryMouseButtonToggle() {
  const [flippedPrimaryButton, setFlippedPrimaryButton] = useSettings(
    'flipPrimaryMouseButton'
  );
  return (
    <div
      {...tip(
        'Whether to use left click for light tiles (Reload to take effect)',
        'bottom'
      )}
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

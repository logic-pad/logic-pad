import { memo } from 'react';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function SansSerifToggle() {
  const [sansSerif, setSansSerif] = useSettings('sansSerifFont');
  return (
    <div {...tip('Use a sans-serif font for the whole site', 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">Sans-serif font</span>
          <input
            type="checkbox"
            className="toggle"
            checked={sansSerif}
            onChange={e => setSansSerif(e.currentTarget.checked)}
          />
        </label>
      </fieldset>
    </div>
  );
});

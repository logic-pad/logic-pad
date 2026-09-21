import { memo } from 'react';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function OfflineModeToggle() {
  const [offlineMode, setOfflineMode] = useSettings('offlineMode');
  return (
    <div {...tip('Disable all online features', 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">Offline mode</span>
          <input
            type="checkbox"
            className="toggle"
            checked={offlineMode}
            onChange={e => setOfflineMode(e.currentTarget.checked)}
          />
        </label>
      </fieldset>
    </div>
  );
});

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function OfflineModeToggle() {
  const { t } = useLingui();
  const [offlineMode, setOfflineMode] = useSettings('offlineMode');
  return (
    <div {...tip(t`Disable all online features`, 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">{t`Offline mode`}</span>
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

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function ExitConfirmationToggle() {
  const { t } = useLingui();
  const [enableExitConfirmation, setEnableExitConfirmation] = useSettings(
    'enableExitConfirmation'
  );
  return (
    <div
      {...tip(
        t`Whether Logic Pad should ask for confirmation before leaving the page`,
        'bottom'
      )}
    >
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">{t`Enable exit confirmations`}</span>
          <input
            type="checkbox"
            className="toggle"
            checked={enableExitConfirmation}
            onChange={e => setEnableExitConfirmation(e.currentTarget.checked)}
          />
        </label>
      </fieldset>
    </div>
  );
});

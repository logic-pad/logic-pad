import { memo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export default memo(function ExitConfirmationToggle() {
  const [enableExitConfirmation, setEnableExitConfirmation] = useSettings(
    'enableExitConfirmation'
  );
  return (
    <div
      className="tooltip tooltip-info tooltip-bottom"
      data-tip="Whether Logic Pad should ask for confirmation before leaving the page"
    >
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">Enable exit confirmations</span>
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

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function KeyboardLayoutDropdown() {
  const { t } = useLingui();
  const [keyboardLayout, setKeyboardLayout] = useSettings('keyboardLayout');
  return (
    <div {...tip(t`Select your keyboard layout for hotkeys`, 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">{t`Keyboard Layout`}</span>
          <select
            className="select select-md w-fit select-bordered"
            value={keyboardLayout}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            onChange={e => setKeyboardLayout(e.currentTarget.value as any)}
          >
            <option value="qwerty">Qwerty</option>
            <option value="azerty">Azerty</option>
            <option value="dvorak">Dvorak</option>
            <option value="colemak">Colemak</option>
          </select>
        </label>
      </fieldset>
    </div>
  );
});

import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function GridInsightToggle() {
  const { t } = useLingui();
  const [insights, setInsights] = useSettings('enableGridInsight');
  return (
    <div {...tip(t`Enable automatic grid insights`, 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">{t`Grid insights`}</span>
          <input
            type="checkbox"
            className="toggle"
            checked={insights}
            onChange={e => setInsights(e.currentTarget.checked)}
          />
        </label>
      </fieldset>
    </div>
  );
});

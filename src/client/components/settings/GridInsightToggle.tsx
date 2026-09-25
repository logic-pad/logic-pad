import { memo } from 'react';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function GridInsightToggle() {
  const [insights, setInsights] = useSettings('gridInsight');
  return (
    <div {...tip('Enable automatic grid insights', 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">Grid insights</span>
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

import { memo } from 'react';
import { useSettings } from '../../state/settings.ts';
import { tip } from '../Tooltip.tsx';

export default memo(function WrapAroundVisualizationToggle() {
  const [visualizeWrapArounds, setVisualizeWrapArounds] = useSettings(
    'visualizeWrapArounds'
  );
  return (
    <div {...tip('Whether to visualize edges of wrap-around grids', 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">Visualize wrap-around grids</span>
          <input
            type="checkbox"
            className="toggle"
            checked={visualizeWrapArounds}
            onChange={e => setVisualizeWrapArounds(e.currentTarget.checked)}
          />
        </label>
      </fieldset>
    </div>
  );
});

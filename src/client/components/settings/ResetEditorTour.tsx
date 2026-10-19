import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useSettings } from '../../state/settings.ts';
import { cn } from '../../uiHelper';
import { tip } from '../Tooltip.tsx';

export default memo(function ResetEditorTour() {
  const { t } = useLingui();
  const [runEditorTour, setRunEditorTour] = useSettings('runEditorTour');
  return (
    <div
      {...tip(
        runEditorTour
          ? t`Open the editor to see the tour`
          : t`Show the tour in the editor`,
        'left'
      )}
    >
      <button
        className={cn('btn', runEditorTour && 'btn-disabled')}
        onClick={() => {
          setRunEditorTour(true);
        }}
      >
        {t`Reset Editor Tour`}
      </button>
    </div>
  );
});

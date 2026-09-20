import { memo } from 'react';
import { useSettings } from '../../state/settings.ts';
import { cn } from '../../uiHelper';

export default memo(function ResetEditorTour() {
  const [runEditorTour, setRunEditorTour] = useSettings('runEditorTour');
  return (
    <div
      className="tooltip tooltip-info tooltip-left"
      data-tip={
        runEditorTour
          ? 'Open the editor to see the tour'
          : 'Show the tour in the editor'
      }
    >
      <button
        className={cn('btn', runEditorTour && 'btn-disabled')}
        onClick={() => {
          setRunEditorTour(true);
        }}
      >
        Reset Editor Tour
      </button>
    </div>
  );
});

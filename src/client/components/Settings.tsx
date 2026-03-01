import { memo } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import AnimationToggle from './settings/AnimationToggle';
import ResetSite from './settings/ResetSite';
import ExitConfirmationToggle from './settings/ExitConfirmationToggle';
import PrimaryMouseButtonToggle from './settings/PrimaryMouseButtonToggle';
import WrapAroundVisualizationToggle from './settings/WrapAroundVisualizationToggle';
import OfflineModeToggle from './settings/OfflineModeToggle';
import SansSerifToggle from './settings/SansSerifToggle';
import ResetEditorTour from './settings/ResetEditorTour';
import KeyboardLayoutDropdown from './settings/KeyboardLayoutDropdown';
import SfxVolumeSlider from './settings/SfxVolumeSlider';

export default memo(function Settings() {
  return (
    <div
      className="tooltip tooltip-info tooltip-bottom"
      data-tip="Open settings"
    >
      <button
        type="button"
        aria-label="Open settings"
        className="btn btn-square btn-ghost max-md:btn-sm text-neutral-content"
        onClick={() =>
          (
            document.getElementById('settingsModal') as HTMLDialogElement
          ).showModal()
        }
      >
        <IoSettingsOutline size={22} />
      </button>
      <dialog id="settingsModal" className="modal">
        <div className="modal-box max-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-between items-center w-full">
              <h1 className="font-bold text-2xl text-accent">Site settings</h1>
              <form method="dialog" className="flex justify-between gap-4">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn btn-square btn-ghost">✕</button>
              </form>
            </div>
            <div className="flex flex-col shrink-0 gap-2 max-w-[350px] w-full">
              <h3 className="text-xl opacity-80 font-semibold self-start mt-2">
                Input
              </h3>
              <ExitConfirmationToggle />
              <PrimaryMouseButtonToggle />
              <KeyboardLayoutDropdown />
              <h3 className="text-xl opacity-80 font-semibold self-start mt-2">
                Visual
              </h3>
              <AnimationToggle />
              <WrapAroundVisualizationToggle />
              <SansSerifToggle />
              <h3 className="text-xl opacity-80 font-semibold self-start mt-2">
                Online
              </h3>
              <OfflineModeToggle />
              <h3 className="text-xl opacity-80 font-semibold self-start mt-2">
                Sound
              </h3>
              <SfxVolumeSlider />
            </div>
            <div className="modal-action self-stretch justify-between">
              <ResetSite />
              <ResetEditorTour />
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
});

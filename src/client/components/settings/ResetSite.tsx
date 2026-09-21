import { memo } from 'react';
import { tip } from '../Tooltip.tsx';

export async function cleanReload() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Unregistering ${registrations.length} service workers`);
    await Promise.all(
      registrations.map(r => {
        return r.unregister();
      })
    );
  } finally {
    window.location.href = new URL(window.location.href).origin;
  }
}

export default memo(function ResetSite() {
  return (
    <div {...tip('Reset the whole site', 'top', 'error')}>
      <button
        type="button"
        aria-label="Reset site"
        className="btn text-error"
        onClick={() =>
          (
            document.getElementById('reloadModal') as HTMLDialogElement
          ).showModal()
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M320-120v-80H160q-33 0-56.5-23.5T80-280v-480q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v120h-80v-120H160v480h640v-200H512l74 74-56 56-170-170 170-170 56 56-74 74h288q33 0 56.5 23.5T880-480v200q0 33-23.5 56.5T800-200H640v80H320Zm200-400Z" />
        </svg>
        Reset site
      </button>
      <dialog id="reloadModal" className="modal">
        <div className="modal-box">
          <p className="py-4 font-semibold">
            Are you sure you want to completely reset the site?
          </p>
          <p className="py-4">
            Remember to save your puzzles before proceeding!
          </p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-4">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Cancel</button>
              <button
                type="button"
                className="btn btn-error"
                onClick={cleanReload}
              >
                Reset and reload
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
});

import { ReactNode, memo, useId } from 'react';

export interface FullScreenModalProps {
  title: string;
  className?: string;
  onClose?: () => void;
  children: ReactNode;
}

export default memo(function FullScreenModal({
  title,
  className,
  onClose,
  children,
}: FullScreenModalProps) {
  const id = useId();
  return (
    <dialog id={`grid-modal-${id}`} className={className}>
      <div className="modal-box overflow-y-hidden p-0 flex flex-col w-dvw h-dvh max-w-none max-h-none rounded-none shadow-inner">
        {/* An extra layer of div is needed so that the dialog box itself, and any fixed elements inside, are not scrollable. */}
        <div className="overflow-y-auto overscroll-contain w-dvw h-dvh">
          <div className="flex flex-col items-stretch w-full min-h-full xl:h-full">
            <header className="flex shrink-0 flex-wrap justify-between items-center gap-4 px-8 py-2 shadow-md bg-base-300">
              <span className="text-xl my-2">{title}</span>
              <form method="dialog">
                <button
                  aria-label="Close dialog"
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={onClose}
                >
                  ✕
                </button>
              </form>
            </header>
            <div className="flex flex-col items-stretch w-full h-full pt-2">
              {children}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
});

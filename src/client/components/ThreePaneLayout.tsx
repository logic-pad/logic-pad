import React, { memo, useId } from 'react';
import './threePaneLayout.css';
import { IoMenu } from 'react-icons/io5';

export interface ThreePaneLayoutComponentProps {
  left: React.ReactNode;
  right: React.ReactNode;
  center: React.ReactNode;
}

export interface ThreePaneLayoutProps extends ThreePaneLayoutComponentProps {
  collapsible: boolean;
}

const CollapsibleThreePaneLayout = memo(function CollapsibleThreePaneLayout({
  left,
  right,
  center,
}: ThreePaneLayoutComponentProps) {
  const id = useId();
  return (
    <main className="drawer xl:drawer-open lg:h-dvh xl:h-full">
      <input
        id={`three-pane-${id}`}
        type="checkbox"
        className="drawer-toggle three-pane-checkbox"
      />
      <div className="drawer-content flex justify-center items-center h-fit min-h-full lg:h-full flex-col lg:flex-row gap-2 pt-8 pb-28 xl:pt-0 xl:pb-0">
        <label
          htmlFor={`three-pane-${id}`}
          className="btn drawer-button xl:hidden fixed z-20 bottom-32 left-0 pl-8 -ml-4 rounded-l-none shadow-lg"
        >
          <IoMenu size={24} /> Open drawer
        </label>

        <div className="grow shrink overflow-auto self-stretch p-8 py-16 xl:py-8 order-2">
          <div className="flex items-center justify-center m-0 p-0 border-0 min-h-full min-w-full h-fit w-fit">
            {center}
          </div>
        </div>
        <div className="lg:w-[320px] shrink-0 grow-0 flex flex-col items-end lg:self-stretch justify-stretch lg:mr-2 order-1 lg:order-3">
          <div className="lg:w-[320px] h-full flex flex-col items-stretch justify-center gap-4">
            {right}
          </div>
        </div>
      </div>
      <div className="drawer-side visible! opacity-100! overflow-x-visible! overflow-y-visible! z-20 h-full w-full">
        <label
          htmlFor={`three-pane-${id}`}
          aria-label="close sidebar"
          className="drawer-overlay not-[:checked~.drawer-side>&]:opacity-0! not-[:checked~.drawer-side>&]:pointer-events-none transition-opacity"
        ></label>
        <div className="h-full w-full pointer-events-none">
          <div className="h-full w-[320px] max-w-full shrink-0 grow-0 flex flex-col p-4 gap-4 bg-neutral text-neutral-content self-stretch justify-between pointer-events-auto">
            {left}
          </div>
        </div>
      </div>
    </main>
  );
});

const FixedThreePaneLayout = memo(function FixedThreePaneLayout({
  left,
  right,
  center,
}: ThreePaneLayoutComponentProps) {
  return (
    /* Large bottom padding in small screen to fit the floating toolbar */
    <main className="flex flex-1 xl:h-full justify-center items-center flex-col xl:flex-row gap-2 pt-8 pb-28 xl:pt-0 xl:pb-0">
      <div className="w-full max-w-[640px] xl:w-[320px] shrink-0 grow-0 xl:self-stretch flex flex-col p-4 gap-4 text-neutral-content justify-between order-0">
        {left}
      </div>
      <div className="flex flex-1 lg:h-[calc(100dvh-8rem)] xl:h-full justify-center items-center self-stretch flex-col lg:flex-row gap-2">
        <div className="grow shrink lg:h-[calc(100dvh-8rem)] xl:h-full overflow-auto self-stretch p-8 py-16 xl:py-8 order-2">
          <div className="flex items-center justify-center m-0 p-0 min-h-full min-w-full h-fit w-fit">
            {center}
          </div>
        </div>
        <div className="lg:w-[320px] lg:h-[calc(100dvh-8rem)] xl:h-full shrink-0 grow-0 flex flex-col items-end xl:self-stretch justify-stretch lg:mr-2 order-1 lg:order-3">
          <div className="lg:w-[320px] h-full flex flex-col items-stretch justify-center gap-4">
            {right}
          </div>
        </div>
      </div>
    </main>
  );
});

export default memo(function ThreePaneLayout({
  collapsible,
  ...rest
}: ThreePaneLayoutProps) {
  return collapsible ? (
    <CollapsibleThreePaneLayout {...rest} />
  ) : (
    <FixedThreePaneLayout {...rest} />
  );
});

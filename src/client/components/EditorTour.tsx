import React, { memo, useEffect, useMemo, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { EditorTabKey } from '../editor/EditorSideTabs';
import { animate } from 'animejs';
import { useEmbed } from '../contexts/EmbedContext';

interface TourStep {
  target: string;
  content: React.ReactNode;
  beforeStep?: () => void;
  afterStep?: () => void;
}

function toggleEditorSideBar(expanded: boolean) {
  const sideBarCheckbox = document.getElementsByClassName(
    'three-pane-checkbox'
  ) as HTMLCollectionOf<HTMLInputElement>;
  for (const checkbox of sideBarCheckbox) {
    checkbox.checked = expanded;
  }
}

export interface EditorTourProps {
  setEditorTab: (tab: EditorTabKey) => void;
}

export default memo(function EditorTour({ setEditorTab }: EditorTourProps) {
  const { isTopLevel, features } = useEmbed();
  const [runEditorTour, setRunEditorTour] = useSettings('runEditorTour');
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: '.tour-grid-size-editor',
        content: (
          <>
            <div>
              The Tools tab contains everything you need to modify the grid.
            </div>
            <div>You can start by changing the size of the grid.</div>
          </>
        ),
        beforeStep: () => {
          setEditorTab('Tools');
          toggleEditorSideBar(true);
        },
      },
      {
        target: '.tour-tools',
        content: (
          <>
            <div>
              Select a tool to modify the grid. You can also add symbols here.
            </div>
            <div>
              Left and right clicks have different effects for each tool. On
              mobile, you can toggle between them using the button at the lower
              right corner of your screen.
            </div>
          </>
        ),
        beforeStep: () => {
          setEditorTab('Tools');
          toggleEditorSideBar(true);
        },
      },
      {
        target: '.tour-grid',
        content: (
          <>
            <div>Click on the grid to apply your selected tool.</div>
            <div>
              With a symbol tool selected, click on a symbol in the grid to
              configure it.
            </div>
          </>
        ),
        beforeStep: () => {
          setEditorTab('Tools');
          toggleEditorSideBar(false);
        },
      },
      {
        target: '.tour-instruction-search',
        content: (
          <>
            <div>Add rules to the puzzle by searching in this box.</div>
            <div>
              You can click on rules to configure them after adding them to the
              puzzle.
            </div>
          </>
        ),
        beforeStep: () => {
          toggleEditorSideBar(false);
        },
      },
      {
        target: '.tour-metadata-editor',
        content: (
          <>
            <div>
              Give your puzzle a title, a difficulty rating, and optionally a
              description in the Info tab.
            </div>
          </>
        ),
        beforeStep: () => {
          setEditorTab('Info');
          toggleEditorSideBar(true);
        },
      },
      {
        target: '.tour-preview',
        content: (
          <>
            <div>
              Instead of loading the same puzzle in a new tab, you can preview
              solving it right in the editor.
            </div>
          </>
        ),
        beforeStep: () => {
          setEditorTab('Tools');
          toggleEditorSideBar(false);
        },
      },
      {
        target: '.tour-puzzle-checklist',
        content: (
          <>
            <div>
              The puzzle checklist tells you what you need to do before
              publishing your puzzle.
            </div>
            <div>
              You can also run solvers from the checklist to verify your puzzle
              solution.
            </div>
          </>
        ),
        beforeStep: () => {
          toggleEditorSideBar(false);
        },
      },
      {
        target: '.tour-upload',
        content: (
          <>
            <div>
              Upload your puzzle to the cloud to save your progress. You are
              free to edit and delete it before publishing.
            </div>
            <div>
              When the puzzle is ready, publish it to make it available to
              others.
            </div>
          </>
        ),
        beforeStep: () => {
          toggleEditorSideBar(false);
        },
      },
    ],
    [setEditorTab]
  );
  useEffect(() => {
    setCurrentStep(null);
  }, [runEditorTour]);
  useEffect(() => {
    if (currentStep === null) return;
    const step = steps[currentStep];
    step.beforeStep?.();
    const targets = document.querySelectorAll(step.target);
    for (const target of targets) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const animation = animate(step.target, {
      scale: [
        {
          to: 1.15,
          duration: 100,
        },
        {
          to: 1,
          duration: 200,
        },
      ],
      ease: 'inOutSine',
      onComplete: () => {
        const elements = document.querySelectorAll(step.target);
        for (const element of elements) {
          (element as HTMLElement).style.removeProperty('transform');
        }
      },
    });
    const elements = document.querySelectorAll(step.target);
    for (const element of elements) {
      (element as HTMLElement).classList.add('tour-target');
    }
    return () => {
      animation.cancel();
      step.afterStep?.();
      const elements = document.querySelectorAll(step.target);
      for (const element of elements) {
        (element as HTMLElement).classList.remove('tour-target');
      }
    };
  }, [currentStep, steps]);
  if (!runEditorTour) return null;
  if (!isTopLevel) return null;
  // Only do a tour in a full-featured editor, not an embed
  if (
    !features.checklist ||
    !features.instructions ||
    !features.metadata ||
    !features.saveControl ||
    !features.preview
  )
    return null;

  return (
    <div className="fixed w-screen bottom-0 z-10000 flex justify-center p-4 pb-48 md:pb-28 xl:pb-4 pointer-events-none">
      <div className="max-w-full p-4 w-[500px] bg-base-100 text-base-content border-2 border-accent rounded-2xl shadow-2xl flex flex-col gap-2 pointer-events-auto">
        <div className="uppercase text-xs text-base-content/50 tracking-wider font-semibold">
          {currentStep === null
            ? 'Editor tour'
            : `Step ${currentStep + 1} of ${steps.length}`}
        </div>
        {currentStep === null ? (
          <>
            <div>Welcome to the editor! Would you like a quick tour?</div>
            <div>You can restart this tour later from site settings.</div>
          </>
        ) : (
          steps[currentStep].content
        )}
        <div className="flex gap-4 justify-between">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setRunEditorTour(false);
            }}
          >
            Skip
          </button>
          <button
            className="btn btn-accent btn-sm"
            onClick={() => {
              if (currentStep === null) {
                setCurrentStep(0);
              } else if (currentStep === steps.length - 1) {
                setRunEditorTour(false);
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
          >
            {currentStep === null
              ? 'Start tour'
              : currentStep === steps.length - 1
                ? 'Finish'
                : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
});

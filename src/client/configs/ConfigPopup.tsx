import { RefObject, memo, useEffect, useRef, useState } from 'react';
import { getConfigurable, useConfig } from '../contexts/ConfigContext.tsx';
import Config from './parts/Config';
import Rule from '@logic-pad/core/data/rules/rule';
import { useGrid } from '../contexts/GridContext.tsx';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import { useToolbox } from '../contexts/ToolboxContext.tsx';
import SupportLevel from '../components/SupportLevel';
import { mousePosition } from '../../client/uiHelper.ts';
import { useSolver } from '../contexts/SolverContext.tsx';
import { ControlLine, Row } from '@logic-pad/core/data/rules/musicControlLine';
import AnnotatedText from '../components/AnnotatedText.tsx';
import { useHotkeys } from 'react-hotkeys-hook';

const gap = 8;

function getPosition(
  targetRef: RefObject<HTMLElement>,
  boxRef: RefObject<HTMLElement>
) {
  let targetRect = targetRef.current?.getBoundingClientRect();
  let boxRect = boxRef.current?.getBoundingClientRect();
  const windowRect = document.documentElement.getBoundingClientRect();
  if (!targetRect) {
    targetRect = new DOMRect(
      mousePosition.clientX - 30,
      mousePosition.clientY - 30,
      60,
      60
    );
  }
  if (!boxRect) {
    boxRect = new DOMRect(0, 0, 400, 400);
  }
  const ret: { left: string; top: string } = {
    left: 'auto',
    top: 'auto',
  };
  const clampWidth = (width: number) =>
    Math.min(windowRect.width - boxRect.width, Math.max(0, width));
  const clampHeight = (height: number) =>
    Math.min(windowRect.height - boxRect.height, Math.max(0, height));
  if (windowRect.width < 1000) {
    if (targetRect.top > windowRect.height / 2) {
      ret.top = `${clampHeight(targetRect.top - boxRect.height - gap)}px`;
    } else {
      ret.top = `${clampHeight(targetRect.bottom + gap)}px`;
    }
    if (targetRect.left > windowRect.width / 2) {
      ret.left = `${clampWidth(targetRect.right - boxRect.width)}px`;
    } else {
      ret.left = `${clampWidth(Math.max(0, targetRect.left))}px`;
    }
  } else {
    if (targetRect.left > windowRect.width / 2) {
      ret.left = `${clampWidth(targetRect.left - boxRect.width - gap)}px`;
    } else {
      ret.left = `${clampWidth(targetRect.right + gap)}px`;
    }
    if (targetRect.top > windowRect.height / 2) {
      ret.top = `${clampHeight(targetRect.bottom - boxRect.height)}px`;
    } else {
      ret.top = `${clampHeight(targetRect.top)}px`;
    }
  }
  return ret;
}

function containsPoint(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export default memo(function ConfigPopup() {
  const { location, ref, setLocation, setRef } = useConfig();
  const { grid, setGrid } = useGrid();
  const { presets, setPresets } = useToolbox();
  const { solver } = useSolver();

  const configurable = location ? getConfigurable(grid, location) : undefined;

  useEffect(() => {
    if (!configurable) {
      setLocation(undefined);
      setRef(undefined);
    }
  }, [configurable, setLocation, setRef]);

  const popupRef = useRef<HTMLDivElement>(null);
  const popupLocation = useRef<{ left: string; top: string }>({
    left: '',
    top: '',
  });

  const deleteSymbol = () => {
    if (configurable instanceof Rule) {
      setGrid(grid.removeRule(configurable));
    } else if (configurable instanceof Symbol) {
      setGrid(grid.removeSymbol(configurable));
    } else if (configurable instanceof ControlLine) {
      const musicGrid = grid.musicGrid.value;
      if (!musicGrid) return;
      const newLine = configurable.copyWith({
        bpm: null,
        pedal: null,
        checkpoint: false,
      });
      if (newLine.isEmpty) {
        setGrid(
          grid.replaceRule(
            musicGrid,
            musicGrid.copyWith({
              controlLines: musicGrid.controlLines.filter(
                line => line !== configurable
              ),
            })
          )
        );
      } else {
        setGrid(
          grid.replaceRule(
            musicGrid,
            musicGrid.copyWith({
              controlLines: musicGrid.controlLines.map(line =>
                line === configurable ? newLine : line
              ),
            })
          )
        );
      }
    } else if (configurable instanceof Row) {
      const musicGrid = grid.musicGrid.value;
      if (!musicGrid) return;
      if (location?.type !== 'row') return;
      const line = musicGrid.controlLines.find(
        line => line.column === location.column
      );
      if (!line) return;
      const newLine = line.copyWith({
        rows: line.rows.map((row, i) =>
          i === location.row ? new Row(null, null, null) : row
        ),
      });
      if (newLine.isEmpty) {
        setGrid(
          grid.replaceRule(
            musicGrid,
            musicGrid.copyWith({
              controlLines: musicGrid.controlLines.filter(
                l => l.column !== line.column
              ),
            })
          )
        );
      } else {
        setGrid(
          grid.replaceRule(
            musicGrid,
            musicGrid.copyWith({
              controlLines: musicGrid.controlLines.map(l =>
                l.column === line.column ? newLine : l
              ),
            })
          )
        );
      }
    }
    setLocation(undefined);
    setRef(undefined);
  };

  useHotkeys('esc', () => {
    setLocation(undefined);
    setRef(undefined);
  });

  useHotkeys('backspace, delete', deleteSymbol, { preventDefault: true }, [
    grid,
    location,
    configurable,
  ]);

  useEffect(() => {
    if (!location) return;
    const handleClick = (e: PointerEvent) => {
      if (
        !popupRef.current?.contains(e.target as Node) &&
        !(!ref?.current || containsPoint(ref.current, e.clientX, e.clientY))
      ) {
        const symbolOverlay =
          document.querySelector<HTMLElement>('.symbol-overlay');
        if (
          symbolOverlay &&
          containsPoint(symbolOverlay, e.clientX, e.clientY)
        ) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
        }
        if (e.type === 'pointerup') {
          setLocation(undefined);
          setRef(undefined);
        }
      }
    };
    document.addEventListener('pointerdown', handleClick, { capture: true });
    document.addEventListener('pointerup', handleClick, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handleClick, {
        capture: true,
      });
      document.removeEventListener('pointerup', handleClick, { capture: true });
    };
  }, [location, setLocation, setRef, ref]);

  useEffect(() => {
    const handler = () => {
      if (!ref || !popupRef.current) return;
      const styles = getPosition(ref, popupRef as RefObject<HTMLDivElement>);
      if (!styles) return;
      popupRef.current.style.left = styles.left;
      popupRef.current.style.top = styles.top;
      popupLocation.current = styles;
    };
    handler();
    window.addEventListener('resize', handler);
    document
      .querySelector('.overflow-y-auto')
      ?.addEventListener('scroll', handler);
    return () => {
      window.removeEventListener('resize', handler);
      document
        .querySelector('.overflow-y-auto')
        ?.removeEventListener('scroll', handler);
    };
  }, [ref, popupRef]);

  const [presetName, setPresetName] = useState('');

  if (!configurable || !ref) return null;

  const configs = configurable.configs?.filter(config => config.configurable);

  return (
    <div
      className="p-4 z-50 bg-base-300 text-base-content shadow-xl rounded-box w-[400px] fixed transition-all flex flex-col gap-2"
      ref={popupRef}
      style={popupLocation.current}
    >
      <div className="text-accent text-xl font-semibold">
        {configurable.title}
      </div>
      <AnnotatedText className="text-sm opacity-80 -mt-2 mb-2">
        {configurable.configExplanation}
      </AnnotatedText>
      {configs && configs.length > 0 ? (
        configs.map(config => (
          <Config
            key={`${config.field}: ${config.type}`}
            configurable={configurable}
            config={config}
            setConfig={(field, value) => {
              if (configurable instanceof Rule) {
                const newInstruction = configurable.copyWith({
                  [field]: value,
                });
                setGrid(grid.replaceRule(configurable, newInstruction));
              } else if (configurable instanceof Symbol) {
                const newInstruction = configurable.copyWith({
                  [field]: value,
                });
                setGrid(grid.replaceSymbol(configurable, newInstruction));
              } else if (configurable instanceof ControlLine) {
                const newControlLine = configurable.copyWith({
                  [field]: value,
                });
                const musicGrid = grid.musicGrid.value;
                if (!musicGrid) return;
                setGrid(
                  grid.replaceRule(
                    musicGrid,
                    musicGrid.setControlLine(newControlLine)
                  )
                );
              } else if (configurable instanceof Row) {
                const newControlLine = configurable.copyWith({
                  [field]: value,
                });
                const musicGrid = grid.musicGrid.value;
                if (!musicGrid) return;
                if (location?.type !== 'row') return;
                const line = musicGrid.controlLines.find(
                  line => line.column === location.column
                );
                if (!line) return;
                setGrid(
                  grid.replaceRule(
                    musicGrid,
                    musicGrid.setControlLine(
                      line.copyWith({
                        rows: line.rows.map((row, i) =>
                          i === location.row ? newControlLine : row
                        ),
                      })
                    )
                  )
                );
              }
            }}
          />
        ))
      ) : (
        <span className="text-center">Not configurable</span>
      )}
      <div className="flex gap-2 self-stretch justify-between px-2">
        {(configurable instanceof Rule || configurable instanceof Symbol) && (
          <SupportLevel
            validate={!configurable.validateWithSolution}
            solve={solver?.isInstructionSupported(grid, configurable)}
          />
        )}
        <div className="flex-1" />
        {configurable instanceof Symbol && (
          <div className="dropdown dropdown-top">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-sm btn-outline btn-info"
            >
              Add to presets
            </button>
            <div
              tabIndex={0}
              className="dropdown-content not-[.dropdown:focus-within_&]:pointer-events-none z-1 p-2 shadow-lg bg-base-200 text-base-content rounded-box w-72 flex gap-2 mb-2"
            >
              <input
                type="text"
                placeholder="Preset name"
                className="input input-sm w-full"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline btn-info"
                disabled={
                  !!presets.find(p => p.name === presetName) || !presetName
                }
                onClick={() => {
                  setPresets([
                    ...presets,
                    { name: presetName, symbol: configurable },
                  ]);
                  setPresetName('');
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
        <div
          className="tooltip tooltip-error tooltip-top"
          data-tip="(backspace/del)"
        >
          <button
            type="button"
            className="btn btn-sm btn-outline btn-error"
            onClick={deleteSymbol}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

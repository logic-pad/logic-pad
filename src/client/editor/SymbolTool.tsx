import React, {
  HTMLProps,
  memo,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import ToolboxItem, { ToolboxHotkey } from './ToolboxItem';
import {
  getConfigurableLocation,
  useConfig,
} from '../contexts/ConfigContext.tsx';
import { useGrid } from '../contexts/GridContext.tsx';
import { Color, Position } from '@logic-pad/core/data/primitives';
import { cn, eq, mousePosition } from '../../client/uiHelper.ts';
import PointerCaptureOverlay, {
  getPointerLocation,
} from '../grid/PointerCaptureOverlay';
import handleTileClick from '../grid/handleTileClick';
import { SymbolProps } from '../symbols';
import GridData from '@logic-pad/core/data/grid';
import NumberSymbol from '@logic-pad/core/data/symbols/numberSymbol';

export interface SymbolToolProps extends HTMLProps<HTMLDivElement> {
  name: string;
  id?: string;
  hotkey?: ToolboxHotkey;
  sample: Symbol;
  component: React.NamedExoticComponent<SymbolProps<any>>;
  order?: number;
  defaultHidden?: boolean;
  onNewSymbol?: (symbol: Symbol, grid: GridData) => Symbol;
}

const SymbolToolOverlay = memo(function SymbolToolOverlay({
  sample,
  onNewSymbol,
}: Pick<SymbolToolProps, 'sample' | 'onNewSymbol'>) {
  const { location, setLocation, setRef } = useConfig();
  const { grid, setGrid } = useGrid();
  const [position, setPosition] = useState<Position | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorPosition = useMemo(() => {
    if (location && location.type === 'symbol') {
      const symbol = grid.symbols.get(location.id)?.at(location.index);
      if (symbol) return { x: symbol.x, y: symbol.y };
    }
    return position;
  }, [grid, location, position]);
  const hasSymbol = useMemo(
    () =>
      !!location ||
      (!!position &&
        !!grid.symbols
          .get(sample.id)
          ?.find(n => eq(n.x, position.x) && eq(n.y, position.y))),
    [location, position, grid.symbols, sample.id]
  );

  useEffect(() => {
    if (!overlayRef.current) return;
    const pos = getPointerLocation(
      overlayRef.current,
      mousePosition.clientX,
      mousePosition.clientY,
      grid.width,
      grid.height,
      sample.placementStep,
      { top: 0, left: 0, bottom: 0, right: 0 }
    );
    if (pos.x < 0 || pos.y < 0 || pos.x > grid.width || pos.y > grid.height)
      return;
    setPosition(pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  return (
    <PointerCaptureOverlay
      ref={overlayRef}
      width={grid.width}
      height={grid.height}
      allowDrag={false}
      step={sample.placementStep}
      className="symbol-overlay"
      colorMap={(x, y, color) => {
        if (color === Color.Dark)
          return !!grid.symbols
            .get(sample.id)
            ?.find(n => eq(n.x, x) && eq(n.y, y));
        return false;
      }}
      onTileClick={(x, y, from, to) => {
        if (to === Color.Light) {
          setGrid(
            grid.removeSymbolIf(
              sym => sym.id === sample.id && eq(sym.x, x) && eq(sym.y, y)
            )
          );
          setLocation(undefined);
          setRef(undefined);
          return;
        }
        if (location) return;
        if (from === Color.Dark) {
          setLocation(
            getConfigurableLocation(
              grid,
              grid.findSymbol(
                sym => sym.id === sample.id && eq(sym.x, x) && eq(sym.y, y)
              )!
            )
          );
          setRef(
            cursorRef.current
              ? (cursorRef as RefObject<HTMLDivElement>)
              : undefined
          );
        } else if (to === Color.Dark) {
          if (onNewSymbol) {
            setGrid(
              grid.addSymbol(onNewSymbol(sample.copyWith({ x, y }), grid))
            );
          } else {
            setGrid(grid.addSymbol(sample.copyWith({ x, y })));
          }
        }
      }}
      onPointerMove={(x, y) => setPosition({ x, y })}
      onPointerLeave={() => setPosition(null)}
      onWheel={(x, y, delta) => {
        if (!location) return false;
        if (location.type !== 'symbol') return false;
        const symbol = grid.symbols.get(location.id)?.at(location.index);
        if (!symbol) return false;
        if (!eq(symbol.x, x) || !eq(symbol.y, y)) return false;
        if (!(symbol instanceof NumberSymbol)) return false;
        setGrid(
          grid.replaceSymbol(
            symbol,
            symbol.withNumber(symbol.number + (delta > 0 ? -1 : 1))
          )
        );
        return true;
      }}
    >
      <div
        ref={cursorRef}
        className={cn(
          'absolute -translate-x-1/2 -translate-y-1/2 bg-transparent border-4 border-dashed rounded-[0.1em] pointer-events-none transition-all',
          !cursorPosition && 'hidden',
          hasSymbol
            ? 'h-[0.95em] w-[0.95em] border-info'
            : 'h-[1em] w-[1em] border-accent'
        )}
        style={{
          left: `${(cursorPosition?.x ?? 0) + 0.5}em`,
          top: `${(cursorPosition?.y ?? 0) + 0.5}em`,
        }}
      ></div>
    </PointerCaptureOverlay>
  );
});

export default memo(function SymbolTool(props: SymbolToolProps) {
  let { id } = props;
  const {
    name,
    hotkey,
    sample,
    onNewSymbol,
    component: Component,
    order,
    defaultHidden,
    ...rest
  } = props;
  id = id ?? sample.id;
  return (
    <ToolboxItem
      id={id}
      name={name}
      description="Left click to place a symbol. Click again to configure it. Right click to remove."
      order={order}
      hotkey={hotkey}
      defaultHidden={defaultHidden}
      gridOverlay={
        <SymbolToolOverlay sample={sample} onNewSymbol={onNewSymbol} />
      }
      onTileClick={(x, y, target, flood, gridContext) => {
        handleTileClick(x, y, target, flood, gridContext, true);
      }}
      buttonClassName="text-[42px]"
      {...rest}
    >
      <div className="absolute w-[1em] h-[1em]">
        <Component textClass="text-base-content" symbol={sample} />
      </div>
    </ToolboxItem>
  );
});

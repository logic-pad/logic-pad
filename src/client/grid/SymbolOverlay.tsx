import GridData from '@logic-pad/core/data/grid';
import Symbol from '../symbols/Symbol';
import GridOverlay from './GridOverlay';
import {
  Color,
  GridState,
  State,
  Position,
} from '@logic-pad/core/data/primitives';
import {
  handlesSymbolDisplay,
  SymbolDisplayHandler,
} from '@logic-pad/core/data/events/onSymbolDisplay';
import {
  memo,
  ReactNode,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { cn } from '../uiHelper';
import SymbolData from '@logic-pad/core/data/symbols/symbol';
import Rule from '@logic-pad/core/data/rules/rule';

export interface SymbolOverlayProps {
  grid: GridData;
  solution: GridData | null;
  state?: GridState['symbols'];
  editable: boolean;
  className?: string;
}

function forceGrayFg(symbol: SymbolData, grid: GridData) {
  const toCheck: Position[] = [];
  if (symbol.x % 1 !== 0 && symbol.y % 1 !== 0) {
    toCheck.push({ x: Math.floor(symbol.x), y: Math.floor(symbol.y) });
    toCheck.push({ x: Math.ceil(symbol.x), y: Math.ceil(symbol.y) });
    toCheck.push({ x: Math.floor(symbol.x), y: Math.ceil(symbol.y) });
    toCheck.push({ x: Math.ceil(symbol.x), y: Math.floor(symbol.y) });
  } else if (symbol.x % 1 !== 0) {
    toCheck.push({ x: Math.floor(symbol.x), y: symbol.y });
    toCheck.push({ x: Math.ceil(symbol.x), y: symbol.y });
  } else if (symbol.y % 1 !== 0) {
    toCheck.push({ x: symbol.x, y: Math.floor(symbol.y) });
    toCheck.push({ x: symbol.x, y: Math.ceil(symbol.y) });
  } else {
    toCheck.push({ x: symbol.x, y: symbol.y });
  }
  let color: Color | null = null;
  for (const pos of toCheck) {
    if (!grid.isPositionValid(pos.x, pos.y)) return true;
    const tile = grid.getTile(pos.x, pos.y);
    if (!tile.exists) return true;
    if (color === null) color = tile.color;
    else if (color !== tile.color) return true;
  }
  return false;
}

function fg(color: Color) {
  switch (color) {
    case Color.Dark:
      return cn('text-white');
    case Color.Light:
      return cn('text-black');
    case Color.Gray:
      return cn('text-neutral-content');
  }
}

class SymbolStateManager {
  private state = new Map<string, string | null>();
  private listeners = new Map<string, (() => void)[]>();

  public get(id: string): string | null | undefined {
    return this.state.get(id);
  }

  public set(id: string, state: string | null) {
    if (this.state.get(id) === state) return;
    this.state.set(id, state);
    const listeners = this.listeners.get(id);
    if (listeners) {
      for (const listener of listeners) {
        listener();
      }
    }
  }

  public subscribe(id: string, listener: () => void) {
    let listeners = this.listeners.get(id);
    if (!listeners) {
      listeners = [];
      this.listeners.set(id, listeners);
    }
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }
}

function computeSymbolStates(
  manager: SymbolStateManager,
  grid: GridData,
  solution: GridData | null,
  state: GridState['symbols'] | undefined,
  editable: boolean
) {
  const displayControllingSymbols: (SymbolData & SymbolDisplayHandler)[] = [];
  for (const [_, value] of grid.symbols.entries()) {
    for (const s of value) {
      if (handlesSymbolDisplay(s)) {
        displayControllingSymbols.push(s);
      }
    }
  }
  const displayControllingRules = grid.rules.filter(rule =>
    handlesSymbolDisplay(rule)
  ) as (SymbolDisplayHandler & Rule)[];
  grid.symbols.forEach(symbolList => {
    symbolList.forEach((symbol, i) => {
      const symbolKey = `${symbol.id}-${i}`;
      if (!symbol.visibleWhenSolving && !editable) {
        manager.set(symbolKey, null);
        return;
      }
      for (const s of displayControllingSymbols) {
        if (!s.onSymbolDisplay(grid, solution, symbol, editable)) {
          manager.set(symbolKey, null);
          return;
        }
      }
      for (const rule of displayControllingRules) {
        if (!rule.onSymbolDisplay(grid, solution, symbol, editable)) {
          manager.set(symbolKey, null);
          return;
        }
      }

      let symbolState = state?.get(symbol.id)?.[i];
      symbolState ??= State.Incomplete;
      const tile = grid.getTile(Math.floor(symbol.x), Math.floor(symbol.y));
      manager.set(
        symbolKey,
        cn(
          symbolState === State.Error
            ? 'text-error'
            : symbolState === State.Satisfied
              ? 'text-success'
              : symbolState === State.Ignored
                ? 'text-neutral-content opacity-60'
                : fg(forceGrayFg(symbol, grid) ? Color.Gray : tile.color),
          editable && !symbol.visibleWhenSolving ? 'opacity-60' : ''
        )
      );
    });
  });
}

const SymbolWrapper = memo(function SymbolWrapper({
  symbol,
  symbolKey,
  manager,
}: {
  symbol: SymbolData;
  symbolKey: string;
  manager: SymbolStateManager;
}) {
  const className = useSyncExternalStore(
    useMemo(
      () => (listener: () => void) => manager.subscribe(symbolKey, listener),
      [manager, symbolKey]
    ),
    useMemo(() => () => manager.get(symbolKey) ?? null, [manager, symbolKey])
  );
  if (className === null) return null;
  return <Symbol textClass={className} symbol={symbol} />;
});

const SymbolList = memo(function SymbolList({
  symbols,
  manager,
  className,
}: {
  symbols: GridData['symbols'];
  manager: SymbolStateManager;
  className?: string;
}) {
  const symbolNodes = useMemo(() => {
    const nodes: ReactNode[] = [];
    symbols.forEach(symbolList => {
      symbolList.forEach((symbol, i) => {
        nodes.push(
          <SymbolWrapper
            key={`${symbol.id}-${i}`}
            symbol={symbol}
            symbolKey={`${symbol.id}-${i}`}
            manager={manager}
          />
        );
      });
    });
    return nodes;
  }, [symbols, manager]);
  return <GridOverlay className={className}>{symbolNodes}</GridOverlay>;
});

export default memo(function SymbolOverlay({
  grid,
  solution,
  state,
  editable,
  className,
}: SymbolOverlayProps) {
  const stateManager = useMemo(() => new SymbolStateManager(), []);
  useEffect(() => {
    computeSymbolStates(stateManager, grid, solution, state, editable);
  }, [stateManager, grid, solution, state, editable]);

  return (
    <SymbolList
      symbols={grid.symbols}
      manager={stateManager}
      className={className}
    />
  );
});

import React, { createContext, memo, use, useState } from 'react';
import GridData from '@logic-pad/core/data/grid';
import Rule from '@logic-pad/core/data/rules/rule';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import Configurable from '@logic-pad/core/data/configurable';
import { ControlLine, Row } from '@logic-pad/core/data/rules/musicControlLine';

export type ConfigurableLocation =
  | {
      type: 'rule';
      index: number;
    }
  | {
      type: 'symbol';
      id: string;
      index: number;
    }
  | {
      type: 'controlLine';
      column: number;
    }
  | {
      type: 'row';
      column: number;
      row: number;
    };

export function getConfigurable(
  grid: GridData,
  location: ConfigurableLocation
) {
  if (location.type === 'rule') {
    return grid.rules[location.index];
  } else if (location.type === 'symbol') {
    const list = grid.symbols.get(location.id);
    if (!list) return undefined;
    return list[location.index];
  } else if (location.type === 'controlLine') {
    const musicGrid = grid.musicGrid.value;
    if (!musicGrid) return undefined;
    return musicGrid.controlLines.find(line => line.column === location.column);
  } else if (location.type === 'row') {
    const musicGrid = grid.musicGrid.value;
    if (!musicGrid) return undefined;
    const line = musicGrid.controlLines.find(
      line => line.column === location.column
    );
    if (!line) return undefined;
    return line.rows[location.row];
  }
}

export function getConfigurableLocation(
  grid: GridData,
  configurable: Rule | Symbol | ControlLine
): ConfigurableLocation | undefined;
export function getConfigurableLocation(
  grid: GridData,
  configurable: Row,
  line: ControlLine
): ConfigurableLocation | undefined;
export function getConfigurableLocation(
  grid: GridData,
  configurable: Configurable,
  line?: ControlLine
): ConfigurableLocation | undefined {
  if (configurable instanceof Rule) {
    return {
      type: 'rule',
      index: grid.rules.indexOf(configurable),
    };
  } else if (configurable instanceof Symbol) {
    const list = grid.symbols.get(configurable.id);
    if (!list) return undefined;
    return {
      type: 'symbol',
      id: configurable.id,
      index: list.indexOf(configurable),
    };
  } else if (configurable instanceof ControlLine) {
    const musicGrid = grid.musicGrid.value;
    if (!musicGrid) return undefined;
    return {
      type: 'controlLine',
      column: configurable.column,
    };
  } else if (configurable instanceof Row) {
    if (!line) return undefined;
    return {
      type: 'row',
      column: line.column,
      row: line.rows.indexOf(configurable),
    };
  }
  return undefined;
}

interface ConfigContext {
  location: ConfigurableLocation | undefined;
  ref: React.RefObject<HTMLElement> | undefined;
  setLocation: (value: ConfigurableLocation | undefined) => void;
  setRef: (value: React.RefObject<HTMLElement> | undefined) => void;
}

const Context = createContext<ConfigContext>({
  location: undefined,
  ref: undefined,
  setLocation: () => {},
  setRef: () => {},
});

export const useConfig = () => {
  return use(Context);
};

export const ConfigConsumer = Context.Consumer;

export default memo(function ConfigContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, setLocation] = useState<ConfigurableLocation | undefined>(
    undefined
  );
  const [ref, setRef] = useState<React.RefObject<HTMLElement> | undefined>(
    undefined
  );

  return (
    <Context
      value={{
        location,
        ref,
        setLocation,
        setRef,
      }}
    >
      {children}
    </Context>
  );
});

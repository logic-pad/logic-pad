import React, { createContext, memo, useCallback, use, useState } from 'react';
import { Color } from '@logic-pad/core/data/primitives';
import { GridContext } from './GridContext.tsx';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';

export type Presets = { name: string; symbol: Symbol }[];

interface ToolboxContext {
  toolId: string | null;
  name: string | null;
  description: string | null;
  gridOverlay: React.ReactNode;
  onTileClick:
    | ((
        x: number,
        y: number,
        target: Color,
        flood: boolean,
        gridContext: GridContext
      ) => void)
    | null;
  setTool: (
    toolId: string | null,
    name: string | null,
    description: string | null,
    gridOverlay: React.ReactNode,
    onTileClick:
      | ((
          x: number,
          y: number,
          target: Color,
          flood: boolean,
          gridContext: GridContext
        ) => void)
      | null
  ) => void;
  presets: Presets;
  setPresets: (presets: Presets) => void;
}

const presetsKey = 'presets';

function savePresets(presets: Presets) {
  const savedPresets = presets.map(({ name, symbol }) => ({
    name,
    symbol: Serializer.stringifySymbol(symbol),
  }));
  localStorage.setItem(presetsKey, JSON.stringify(savedPresets));
}

function loadPresets(): Presets {
  const savedPresets = JSON.parse(localStorage.getItem(presetsKey) ?? '[]') as {
    name: string;
    symbol: string;
  }[];
  return savedPresets.map(({ name, symbol }) => ({
    name,
    symbol: Serializer.parseSymbol(symbol),
  }));
}

const Context = createContext<ToolboxContext>({
  toolId: null,
  name: null,
  description: null,
  gridOverlay: null,
  onTileClick: null,
  setTool: () => {},
  presets: loadPresets(),
  setPresets: () => {},
});

export const useToolbox = () => {
  return use(Context);
};

export const ToolboxConsumer = Context.Consumer;

export default memo(function ToolboxContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toolId, setToolId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [gridOverlay, setGridOverlay] = useState<React.ReactNode>(null);
  const [onTileClick, setOnTileClick] = useState<
    ((x: number, y: number, target: Color, flood: boolean) => void) | null
  >(null);
  const [presets, setPresets] = useState<Presets>(() => loadPresets());

  const setTool = useCallback<ToolboxContext['setTool']>(
    (toolId, name, description, gridOverlay, onTileClick) => {
      setToolId(toolId);
      setName(name);
      setDescription(description);
      setGridOverlay(gridOverlay);
      setOnTileClick(() => onTileClick);
    },
    [setToolId, setName, setDescription, setGridOverlay, setOnTileClick]
  );

  const setPresetsAndSave = useCallback<ToolboxContext['setPresets']>(
    newPresets => {
      setPresets(newPresets);
      savePresets(newPresets);
    },
    [setPresets]
  );

  return (
    <Context
      value={{
        toolId,
        name,
        description,
        gridOverlay,
        onTileClick,
        setTool,
        presets,
        setPresets: setPresetsAndSave,
      }}
    >
      {children}
    </Context>
  );
});

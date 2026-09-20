// eslint-disable-next-line import-x/no-duplicates -- resolver limitation: jotai's typesVersions stub makes 'jotai' and 'jotai/utils' look identical
import { atom } from 'jotai';
// eslint-disable-next-line import-x/no-duplicates -- resolver limitation: jotai's typesVersions stub makes 'jotai' and 'jotai/utils' look identical
import { atomWithStorage } from 'jotai/utils';
import { Color } from '@logic-pad/core/data/primitives';
import { ReactNode } from 'react';
import Symbol from '@logic-pad/core/data/symbols/symbol';
import { Serializer } from '@logic-pad/core/data/serializer/allSerializers';
import { GridActions } from './grid';

export type Presets = { name: string; symbol: Symbol }[];

export type OnTileClick = (
  x: number,
  y: number,
  target: Color,
  flood: boolean,
  gridActions: GridActions
) => void;

export interface ActiveTool {
  toolId: string | null;
  name: string | null;
  description: string | null;
  gridOverlay: ReactNode;
  onTileClick: OnTileClick | null;
}

export const activeToolAtom = atom<ActiveTool | null>(null);

export const toolIdAtom = atom(get => get(activeToolAtom)?.toolId ?? null);
export const toolNameAtom = atom(get => get(activeToolAtom)?.name ?? null);
export const toolDescriptionAtom = atom(
  get => get(activeToolAtom)?.description ?? null
);
export const toolOverlayAtom = atom(
  get => get(activeToolAtom)?.gridOverlay ?? null
);
export const onTileClickAtom = atom(
  get => get(activeToolAtom)?.onTileClick ?? null
);

export const setToolAtom = atom(
  null,
  (
    _get,
    set,
    toolId: string | null,
    name: string | null,
    description: string | null,
    gridOverlay: ReactNode,
    onTileClick: OnTileClick | null
  ) => {
    set(activeToolAtom, {
      toolId,
      name,
      description,
      gridOverlay,
      onTileClick,
    });
  }
);

/**
 * Symbol presets are user-level data: global and shared live
 * across all editor instances (including embedded ones).
 */
export const presetsAtom = atomWithStorage<Presets>(
  'presets',
  [],
  {
    getItem: (key, initialValue) => {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      try {
        const savedPresets = JSON.parse(raw) as {
          name: string;
          symbol: string;
        }[];
        return savedPresets.map(({ name, symbol }) => ({
          name,
          symbol: Serializer.parseSymbol(symbol),
        }));
      } catch (e) {
        console.error('Failed to load presets', e);
        return initialValue;
      }
    },
    setItem: (key, newValue) => {
      const savedPresets = newValue.map(({ name, symbol }) => ({
        name,
        symbol: Serializer.stringifySymbol(symbol),
      }));
      window.localStorage.setItem(key, JSON.stringify(savedPresets));
    },
    removeItem: key => {
      window.localStorage.removeItem(key);
    },
  },
  { getOnInit: true }
);

export const toolboxScopeAtoms = [activeToolAtom];

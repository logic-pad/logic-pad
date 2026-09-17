import { atom } from 'jotai';
import { ReactNode } from 'react';
import { PartPlacement } from '../instructions/parts/types';

export const instructionPartsAtom = atom<
  ReadonlyMap<PartPlacement, ReactNode[]>
>(new Map());

export const addInstructionPartAtom = atom(
  null,
  (get, set, placement: PartPlacement, part: ReactNode) => {
    const parts = get(instructionPartsAtom);
    const newParts = new Map(parts);
    const existing = newParts.get(placement) ?? [];
    newParts.set(placement, [...existing, part]);
    set(instructionPartsAtom, newParts);
  }
);

export const removeInstructionPartAtom = atom(
  null,
  (get, set, placement: PartPlacement, part: ReactNode) => {
    const parts = get(instructionPartsAtom);
    const existing = parts.get(placement);
    if (!existing) return;
    const newParts = new Map(parts);
    newParts.set(
      placement,
      existing.filter(existingPart => existingPart !== part)
    );
    set(instructionPartsAtom, newParts);
  }
);

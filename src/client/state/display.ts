import { atom } from 'jotai';

export const scaleAtom = atom(1);
export const responsiveScaleAtom = atom(true);

export const displayScopeAtoms = [scaleAtom, responsiveScaleAtom];

import { atom } from 'jotai';
import { Position } from '@logic-pad/core/data/primitives';

export const solvePathAtom = atom<Position[]>([]);
export const visualizeSolvePathAtom = atom(false);

export const solvePathScopeAtoms = [solvePathAtom, visualizeSolvePathAtom];

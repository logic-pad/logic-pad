import { atom } from 'jotai';
import Solver from '@logic-pad/core/data/solver/solver';

export const solverAtom = atom<Solver | null>(null);

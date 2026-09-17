import { atom } from 'jotai';
import { Puzzle } from '@logic-pad/core/data/puzzle';
import { PuzzleFull } from '../online/data';
import { defaultGrid } from './grid';

const defaultPuzzle: Puzzle = {
  title: '',
  description: '',
  author: '',
  difficulty: 1,
  grid: defaultGrid,
  solution: null,
};

export const onlinePuzzleIdAtom = atom<string | null>(null);
export const onlinePuzzleAtom = atom<PuzzleFull | null>(null);
export const lastSavedPuzzleAtom = atom<Puzzle>(defaultPuzzle);

export const onlinePuzzleScopeAtoms = [
  onlinePuzzleIdAtom,
  onlinePuzzleAtom,
  lastSavedPuzzleAtom,
];

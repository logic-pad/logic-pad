import { createContext, useContext } from 'react';

export type SolveSidebarPanel = 'main' | 'comments' | 'collection';

export interface SolveScreenContextValue {
  panel: SolveSidebarPanel;
  setPanel: (panel: SolveSidebarPanel) => void;
}

/**
 * Controls which panel is shown in the generic left sidebar of the solve
 * screen. Secondary panels (comments, collection) replace the main sidebar
 * content while keeping the puzzle area fully interactive.
 */
export const SolveScreenContext = createContext<SolveScreenContextValue>({
  panel: 'main',
  setPanel: () => {},
});

export const useSolveScreenContext = () => useContext(SolveScreenContext);

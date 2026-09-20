import { ScopeProvider } from 'jotai-scope';
import { memo, ReactNode } from 'react';
import { configScopeAtoms } from '../config';
import { toolboxScopeAtoms } from '../toolbox';

/**
 * The state scope of a puzzle editor screen (toolbox and config popup state).
 * Mounted by PuzzleEditorScreen, including inside embedded editor modals.
 */
export const EditorScope = memo(function EditorScope({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopeProvider
      name="editor"
      atoms={[...configScopeAtoms, ...toolboxScopeAtoms]}
    >
      {children}
    </ScopeProvider>
  );
});

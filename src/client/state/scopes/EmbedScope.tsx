import { useSetAtom } from 'jotai';
import { ScopeProvider } from 'jotai-scope';
import { memo, ReactNode, useEffect } from 'react';
import {
  EmbedFeatures,
  embedChildrenAtom,
  embedFeaturesAtom,
  defaultEmbedFeatures,
} from '../embed';

/**
 * Registers this embed in the parent scope's embedChildren and isolates
 * embed state for its children.
 */
export const EmbedScope = memo(function EmbedScope({
  name,
  features,
  children,
}: {
  name: string;
  features?: EmbedFeatures;
  children: ReactNode;
}) {
  // writes to the parent scope's atom: this component renders outside the ScopeProvider below
  const setParentChildren = useSetAtom(embedChildrenAtom);
  useEffect(() => {
    setParentChildren(children => [...children, name]);
    return () => {
      setParentChildren(children => children.filter(k => k !== name));
    };
  }, [name, setParentChildren]);
  return (
    <ScopeProvider
      atoms={[
        [embedFeaturesAtom, features ?? defaultEmbedFeatures],
        [embedChildrenAtom, []],
      ]}
      name={`embed:${name}`}
    >
      {children}
    </ScopeProvider>
  );
});

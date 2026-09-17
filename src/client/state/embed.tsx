import { atom, useSetAtom } from 'jotai';
import { ScopeProvider } from 'jotai-scope';
import React, { memo, useEffect } from 'react';

export interface EmbedFeatures {
  instructions: boolean;
  metadata: boolean;
  checklist: boolean;
  saveControl: boolean;
  preview: boolean;
}

export const defaultEmbedFeatures: EmbedFeatures = {
  instructions: true,
  metadata: true,
  checklist: true,
  saveControl: true,
  preview: true,
};

export const embedFeaturesAtom = atom<EmbedFeatures>(defaultEmbedFeatures);
export const embedChildrenAtom = atom<string[]>([]);
export const isTopLevelAtom = atom(get => get(embedChildrenAtom).length === 0);

export const embedScopeAtoms = [embedFeaturesAtom, embedChildrenAtom];

/**
 * Registers this embed in the parent scope's embedChildren and isolates
 * embed state for its children.
 */
export default memo(function EmbedScope({
  name,
  features,
  children,
}: {
  name: string;
  features?: EmbedFeatures;
  children: React.ReactNode;
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

import { atom } from 'jotai';

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

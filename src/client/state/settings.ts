// eslint-disable-next-line import-x/no-duplicates -- resolver limitation: jotai's typesVersions stub makes 'jotai' and 'jotai/utils' look identical
import { atom, getDefaultStore, useAtom } from 'jotai';
// eslint-disable-next-line import-x/no-duplicates -- resolver limitation: jotai's typesVersions stub makes 'jotai' and 'jotai/utils' look identical
import { atomWithStorage } from 'jotai/utils';
import { useMemo } from 'react';
import { z } from 'zod';
import { externalReducedMotion } from '../uiHelper';

export const SiteSettingsSchema = z.object({
  enableFancyAnimations: z.boolean().default(true).catch(true),
  enableExitConfirmation: z.boolean().default(true).catch(true),
  flipPrimaryMouseButton: z.boolean().default(false).catch(false),
  visualizeWrapArounds: z.boolean().default(true).catch(true),
  showMoreTools: z.boolean().default(false).catch(false),
  offlineMode: z.boolean().default(false).catch(false),
  sansSerifFont: z.boolean().default(false).catch(false),
  runEditorTour: z.boolean().default(true).catch(true),
  keyboardLayout: z
    .enum(['qwerty', 'azerty', 'dvorak', 'colemak'])
    .default('qwerty')
    .catch('qwerty'),
  sfxVolume: z.number().min(0).max(2).default(1).catch(1),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

const initialSettings = SiteSettingsSchema.parse({});

// clean up old settings
(() => {
  window.localStorage.removeItem('reducedMotion');
  window.localStorage.removeItem('bypassExitConfirmation');
  window.localStorage.removeItem('flipPrimaryMouseButton');
})();

export const settingsAtom = atomWithStorage<SiteSettings>(
  'siteSettings',
  initialSettings,
  {
    getItem: (key, initialValue) => {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      try {
        // the schema catches and heals invalid individual fields
        return SiteSettingsSchema.parse(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to load settings', e);
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
    },
    setItem: (key, newValue) => {
      window.localStorage.setItem(key, JSON.stringify(newValue));
    },
    removeItem: key => {
      window.localStorage.removeItem(key);
    },
  },
  { getOnInit: true }
);

export function useSettings<const T extends keyof SiteSettings>(key: T) {
  const keyAtom = useMemo(
    () =>
      atom(
        get => get(settingsAtom)[key],
        (get, set, value: SiteSettings[T]) => {
          set(settingsAtom, { ...get(settingsAtom), [key]: value });
        }
      ),
    [key]
  );
  return useAtom(keyAtom);
}

/**
 * Read a setting outside of React. Non-reactive.
 */
export function getSetting<const T extends keyof SiteSettings>(
  key: T
): SiteSettings[T] {
  return getDefaultStore().get(settingsAtom)[key];
}

export function useReducedMotion() {
  const [enableFancyAnimations] = useSettings('enableFancyAnimations');
  return useMemo(
    () => !enableFancyAnimations || externalReducedMotion(),
    [enableFancyAnimations]
  );
}

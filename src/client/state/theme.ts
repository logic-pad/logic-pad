import { useMonaco } from '@monaco-editor/react';
// eslint-disable-next-line import-x/no-duplicates -- resolver limitation: jotai's typesVersions stub makes 'jotai' and 'jotai/utils' look identical
import { useAtom } from 'jotai';
// eslint-disable-next-line import-x/no-duplicates -- resolver limitation: jotai's typesVersions stub makes 'jotai' and 'jotai/utils' look identical
import { atomWithStorage } from 'jotai/utils';
import { editor } from 'monaco-editor';
import { memo, useEffect } from 'react';

export const themeKey = 'theme';

export const SUPPORTED_THEMES = [
  ['dark', 'vs-dark'],
  ['light', 'vs'],
  ['cupcake', 'vs'],
  ['bumblebee', 'vs'],
  ['emerald', 'vs'],
  ['corporate', 'vs'],
  ['synthwave', 'Cobalt'],
  ['retro', 'Solarized-light'],
  ['cyberpunk', 'Solarized-light'],
  ['valentine', 'vs'],
  ['halloween', 'vs-dark'],
  ['garden', 'vs'],
  ['forest', 'hc-black'],
  ['aqua', 'Tomorrow-Night-Blue'],
  ['sky', 'Tomorrow-Night-Blue'],
  ['lofi', 'hc-black'],
  ['pastel', 'GitHub'],
  ['fantasy', 'vs-dark'],
  ['wireframe', 'GitHub'],
  ['black', 'vs-dark'],
  ['luxury', 'vs-dark'],
  ['dracula', 'Dracula'],
  ['cmyk', 'vs'],
  ['autumn', 'vs'],
  ['business', 'vs-dark'],
  ['acid', 'vs'],
  ['lemonade', 'Solarized-light'],
  ['night', 'vs-dark'],
  ['coffee', 'vs-dark'],
  ['winter', 'vs'],
  ['dim', 'vs-dark'],
  ['nord', 'vs'],
  ['sunset', 'vs-dark'],
];

export const themeAtom = atomWithStorage(themeKey, 'dark', undefined, {
  getOnInit: true,
});

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  return { theme, setTheme };
}

/**
 * Applies the current theme to the document and to Monaco.
 * Mount once at the app root.
 */
export default memo(function ThemeSynchronizer() {
  const [theme] = useAtom(themeAtom);
  const monaco = useMonaco();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const editorTheme = SUPPORTED_THEMES.find(([t]) => t === theme)?.[1];
    if (monaco && editorTheme) {
      import(`../../../node_modules/monaco-themes/themes/${editorTheme}.json`)
        .then(data => {
          monaco.editor.defineTheme(
            editorTheme,
            data as editor.IStandaloneThemeData
          );
          monaco.editor.setTheme(editorTheme);
        })
        .catch(() => {
          monaco.editor.setTheme(editorTheme);
        })
        .catch(console.log);
    }
  }, [theme, monaco]);

  return null;
});

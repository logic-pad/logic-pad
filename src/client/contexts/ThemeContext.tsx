import { useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import React, { createContext, memo, use, useEffect, useState } from 'react';

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

interface ThemeContext {
  theme: string;
  setTheme: (value: string) => void;
}

const Context = createContext<ThemeContext>({
  theme: localStorage.getItem(themeKey) ?? 'dark',
  setTheme: () => {},
});

export const useTheme = () => {
  return use(Context);
};

export const ThemeConsumer = Context.Consumer;

export default memo(function ThemeContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(themeKey) ?? 'dark'
  );
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

  return (
    <Context
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </Context>
  );
});

import { memo } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { cn } from '../../client/uiHelper.ts';
import {
  SUPPORTED_THEMES,
  themeKey,
  useTheme,
} from '../contexts/ThemeContext.tsx';

export default memo(function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const switchTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem(themeKey, newTheme);
  };

  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost text-neutral-content"
      >
        Theme
        <FiChevronDown />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-50 p-2 shadow-2xl bg-base-300 text-base-content rounded-box w-52 max-h-[calc(100dvh-200px)] overflow-y-auto"
        aria-label="Themes"
        role="listbox"
      >
        {SUPPORTED_THEMES.map(([themeChoice]) => (
          <li key={themeChoice} className="relative">
            <input
              type="radio"
              name="theme-dropdown"
              className={cn(
                'theme-controller btn btn-sm btn-block justify-start capitalize', // theme-controller is required to change CSS styles before the theme context is set
                theme === themeChoice ? 'btn-primary' : 'btn-ghost'
              )}
              aria-label={themeChoice}
              role="option"
              value={themeChoice}
              onChange={e => switchTheme(e.currentTarget.value)}
            />
            <div
              data-theme={themeChoice}
              className="absolute right-4 top-1 bottom-1 flex items-center gap-1 p-1 bg-neutral rounded-md pointer-events-none"
            >
              <div className="h-full w-2 bg-base-100 rounded-sm"></div>
              <div className="h-full w-2 bg-primary rounded-sm"></div>
              <div className="h-full w-2 bg-secondary rounded-sm"></div>
              <div className="h-full w-2 bg-accent rounded-sm"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

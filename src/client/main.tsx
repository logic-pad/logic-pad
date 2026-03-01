import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from '@tanstack/react-router';
import { themeKey } from './contexts/ThemeContext.tsx';
import { cleanReload } from './components/settings/ResetSite.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import OnlineContext from './contexts/OnlineContext.tsx';
import { queryClient } from './online/api.ts';
import { useSettings } from './contexts/SettingsContext.tsx';
import { router } from './router/router.tsx';

// load the selected theme early to avoid flicker
const savedTheme = localStorage.getItem(themeKey) ?? 'dark';
document.documentElement.dataset.theme = savedTheme;

const redirectDomains = import.meta.env.VITE_LEGACY_URL?.split(',');

function Redirector() {
  if (redirectDomains?.includes(window.location.host)) {
    const newUrl = new URL(window.location.href);
    newUrl.host = import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL as string;
    window.location.href = newUrl.toString();
  }
  return null;
}

function FontSwitcher() {
  const [sansSerif] = useSettings('sansSerifFont');
  useEffect(() => {
    document.documentElement.style.fontFamily = sansSerif
      ? '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"'
      : 'Palatino Linotype,Palatino,Palatino LT STD,Book Antiqua,Georgia,serif';
  }, [sansSerif]);
  return null;
}

/**
 * Reload the page when a preload error occurs. This usually happens during a new deployment when the user still
 * has the old version of the site open.
 */
window.addEventListener('vite:preloadError', async () => {
  await cleanReload();
});

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OnlineContext>
        <>
          <Redirector />
          <FontSwitcher />
          <div id="color-ref-error" className="text-error hidden">
            {/* For canvas components to retrieve this color */}
          </div>
          <div id="color-ref-accent" className="text-accent hidden">
            {/* For canvas components to retrieve this color */}
          </div>
          <div id="color-ref-secondary" className="text-secondary hidden">
            {/* For canvas components to retrieve this color */}
          </div>
          <div id="color-ref-info" className="text-info hidden">
            {/* For canvas components to retrieve this color */}
          </div>
          <div id="color-ref-black" className="text-black hidden">
            {/* For canvas components to retrieve this color */}
          </div>
          <div id="color-ref-white" className="text-white hidden">
            {/* For canvas components to retrieve this color */}
          </div>
          <div
            id="color-ref-neutral-content"
            className="text-neutral-content/20 hidden"
          >
            {/* For canvas components to retrieve this color */}
          </div>
          <RouterProvider router={router} />
        </>
      </OnlineContext>
    </QueryClientProvider>
  </React.StrictMode>
);

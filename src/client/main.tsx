import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from '@tanstack/react-router';
import { I18nProvider } from '@lingui/react';
import { themeKey } from './state/theme.ts';
import { cleanReload } from './components/settings/ResetSite.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { VersionMismatchWatcher, useOnline } from './state/online.ts';
import { queryClient } from './online/api.ts';
import { useSettings } from './state/settings.ts';
import onlineSolveTracker from './online/solveTracking/onlineSolveTracker.ts';
import { ANONYMOUS_USER_ID } from './online/solveTracking/progressDb.ts';
import { router } from './router/router.tsx';
import { activateLocale, DEFAULT_LOCALE, i18n } from './locales/i18n';
import { getActiveLocale } from './router/localeRewrite.ts';

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

/**
 * Bind the solve tracker to the current identity once the online status and
 * `me` are settled. Non-blocking by design: cards render without indicators
 * until the tracker hydrates from IndexedDB, and a background server refresh
 * may repaint them later. While offline the tracker is left alone, so cached
 * progress is never wiped by a transient network failure.
 */
function ProgressBootstrap() {
  const { isOnline, me, isPending } = useOnline();
  useEffect(() => {
    if (isPending || !isOnline) return;
    onlineSolveTracker.bind(me?.id ?? ANONYMOUS_USER_ID);
  }, [isOnline, me, isPending]);
  return null;
}

function mount() {
  ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
      <I18nProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <>
            <VersionMismatchWatcher />
            <ProgressBootstrap />
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
        </QueryClientProvider>
      </I18nProvider>
    </React.StrictMode>
  );
}

// Activate the locale named by the URL before mounting so the tree renders
// translated from the first frame instead of flashing message ids. A catalog
// that fails to load (for example after a redeploy rotated chunk hashes)
// degrades to the default locale rather than blocking startup.
void activateLocale(getActiveLocale())
  .catch(() => activateLocale(DEFAULT_LOCALE))
  .finally(mount);

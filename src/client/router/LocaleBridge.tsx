import { memo, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { router } from './router.tsx';
import {
  addLocalePrefix,
  parseLocale,
  removeLocalePrefix,
} from './localeRewrite.ts';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../locales/i18n';

/**
 * Keeps the document in step with the locale carried by the address bar:
 * canonicalises the default-locale prefix, sets `<html lang>`, and publishes
 * `hreflang` alternates.
 *
 * Mount once, inside the router.
 */
export default memo(function LocaleBridge() {
  const publicHref = useRouterState({ select: s => s.location.publicHref });

  const { pathname, search, hash } = new URL(publicHref, 'http://localhost');
  const detected = parseLocale(pathname);
  const canonicalPath = removeLocalePrefix(pathname);

  useEffect(() => {
    document.documentElement.lang = detected ?? DEFAULT_LOCALE;
  }, [detected]);

  useEffect(() => {
    // `/en` and its subroutes are not canonical: the default locale is served
    // unprefixed, so drop the segment. Crawlers get a 301 from the static
    // server instead; this covers client-side entry (dev, or a deep link
    // resolved by the SPA fallback).
    if (detected !== DEFAULT_LOCALE || canonicalPath === pathname) return;
    router.history.replace(
      canonicalPath + search + hash,
      router.state.location.state,
      {
        ignoreBlocker: true,
      }
    );
  }, [pathname, canonicalPath, search, hash, detected]);

  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const basePath = `${canonicalPath}${search}${hash}`;

  return (
    <>
      {SUPPORTED_LOCALES.map(locale => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={origin + addLocalePrefix(locale, basePath)}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={origin + addLocalePrefix(DEFAULT_LOCALE, basePath)}
      />
    </>
  );
});

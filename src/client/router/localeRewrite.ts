import { type LocationRewrite } from '@tanstack/react-router';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type Locale,
} from '../locales/i18n';

/**
 * Matches a leading locale segment, e.g. the `/ja` in `/ja/solve/abc`.
 * Case-insensitive so `/JA/...` is understood rather than 404ing; the canonical
 * lowercase form is restored by {@link removeLocalePrefix}'s callers.
 */
const LOCALE_PREFIX = new RegExp(
  `^/(?:${SUPPORTED_LOCALES.join('|')})(?=/|$)`,
  'i'
);

/**
 * The locale a pathname carries as its prefix, or `undefined` when it is
 * unprefixed (which means {@link DEFAULT_LOCALE}).
 */
export function parseLocale(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1]?.toLowerCase();
  return segment !== undefined && isSupportedLocale(segment)
    ? segment
    : undefined;
}

/**
 * The locale the browser is currently asking for.
 */
export function getActiveLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return parseLocale(window.location.pathname) ?? DEFAULT_LOCALE;
}

/** Drop a leading locale prefix, yielding the router-internal pathname. */
export function removeLocalePrefix(pathname: string): string {
  const match = LOCALE_PREFIX.exec(pathname);
  if (!match) return pathname;
  const rest = pathname.slice(match[0].length);
  return rest === '' ? '/' : rest;
}

/**
 * Add `locale`'s prefix to a router-internal href (pathname + search + hash).
 *
 * The default locale is unprefixed, so `/` stays `/` and `/solve/abc` stays
 * as-is; other locales gain a leading segment.
 */
export function addLocalePrefix(locale: Locale, href: string): string {
  if (locale === DEFAULT_LOCALE) return href;
  const url = new URL(href, 'http://localhost');
  const path = url.pathname === '/' ? '' : url.pathname;
  return `/${locale}${path}${url.search}${url.hash}`;
}

/**
 * Bidirectional locale-prefix rewriting, per
 * https://tanstack.com/router/latest/docs/guide/internationalization-i18n
 *
 * Note that a prefix-only change cannot be committed with `navigate`/
 * `commitLocation`: those compare the *internal* href, which is identical with
 * and without the prefix, so the write is skipped. Switch locale with
 * `useLocale()` in `router/useLocale.ts` instead.
 */
export const localeRewrite: LocationRewrite = {
  input: ({ url }) => {
    url.pathname = removeLocalePrefix(url.pathname);
    return url;
  },
  output: ({ url }) => {
    const currentLocale = getActiveLocale();
    if (currentLocale === DEFAULT_LOCALE) return url;
    url.pathname =
      url.pathname === '/'
        ? `/${currentLocale}`
        : `/${currentLocale}${url.pathname}`;
    return url;
  },
};

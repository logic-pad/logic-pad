import { useRouterState } from '@tanstack/react-router';
import { useCallback } from 'react';
import { DEFAULT_LOCALE, Locale, activateLocale } from '../locales/i18n';
import { parseLocale, addLocalePrefix } from './localeRewrite';
import { router } from './router';

/**
 * The locale implied by the address bar.
 *
 * Components that render text contributed by `@logic-pad/core` (rule titles,
 * explanations, config labels) must call this: that text is read straight off
 * core objects, so it is invisible to `I18nProvider` and would otherwise keep
 * the previous language until something else happened to re-render the
 * component. Subscribing here makes the locale change itself a re-render.
 */
export function useActiveLocale(): Locale {
  const publicHref = useRouterState({ select: s => s.location.publicHref });
  return (
    parseLocale(new URL(publicHref, 'http://localhost').pathname) ??
    DEFAULT_LOCALE
  );
}

/**
 * Get or set the current locale.
 *
 * Switching rewrites only the locale prefix of the current URL and leaves the
 * route matched, so in-memory state (an unsaved puzzle in the editor, scroll
 * position, query caches) survives the change.
 */
export function useLocale() {
  const locale = useActiveLocale();

  const switchLocale = useCallback(async (next: Locale) => {
    // Catalogs first: the URL must never point at a locale whose strings are
    // not loaded yet.
    await activateLocale(next);

    const { location } = router.state;
    const href = addLocalePrefix(next, location.href);
    if (href === location.publicHref) return;

    // Deliberately not `navigate()`: the internal href is unchanged by a
    // prefix-only edit, so `commitLocation` would treat it as a no-op and never
    // touch the address bar. Writing through the history layer instead makes it
    // notify the router, which re-parses the URL (applying the input rewrite)
    // and re-renders with the new publicHref.
    //
    // Blockers are ignored because the route does not change: leaving the
    // editor is what prompts for confirmation, not translating it.
    router.history.replace(href, location.state, { ignoreBlocker: true });
  }, []);

  return [locale, switchLocale] as const;
}

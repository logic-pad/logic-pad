import type { I18n, Values } from '@lingui/core';

/**
 * A locale bundle: a lingui instance preloaded with the user-facing messages of
 * this package. Install one with {@link setLocale} to resolve message ids to
 * translated text.
 */
export interface Locale {
  readonly code: string;
  readonly i18n: I18n;
}

let activeLocale: Locale | undefined;

/**
 * Install the locale used for user-facing strings, or `undefined` to go back to
 * emitting raw message ids.
 */
export function setLocale(locale: Locale | undefined): void {
  activeLocale = locale;
}

/** The currently installed locale, if any. */
export function getLocale(): Locale | undefined {
  return activeLocale;
}

/**
 * Translation facade for user-facing strings in `@logic-pad/core`.
 *
 * The binding is named `i18n` on purpose: lingui's stock message extractor
 * recognises `i18n.t('literal-id')` call sites, so `lingui extract` collects
 * every id in this package without custom tooling.
 */
export const i18n = {
  t(id: string, values?: Values): string {
    return activeLocale
      ? activeLocale.i18n.t(id, values)
      : `${id}${values ? JSON.stringify(values) : ''}`;
  },
};

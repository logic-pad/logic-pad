import { type I18n, type Values } from '@lingui/core';
import { i18n as enI18n } from './en';
import { i18n as jaI18n } from './ja';

export type Locale = 'en' | 'ja';
const DEFAULT_LOCALE: Locale = 'en';

const instances: Record<Locale, I18n> = {
  en: enI18n,
  ja: jaI18n,
};

/**
 * A translation facade for one request's locale.
 *
 * The binding is named `i18n` at the call site on purpose: lingui's stock
 * message extractor recognises `i18n.t('literal-id')`, so `lingui extract`
 * collects every id in `src/ssr` without custom tooling.
 */
export function i18nFor(locale: Locale): {
  t(id: string, values?: Values): string;
} {
  const instance = instances[locale] ?? instances[DEFAULT_LOCALE];
  return {
    t: (id, values) => instance._(id, values),
  };
}

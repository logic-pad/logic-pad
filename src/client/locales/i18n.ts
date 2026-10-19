import { setupI18n } from '@lingui/core';
import {
  setLocale as setCoreLocale,
  type Locale as CoreLocale,
} from '@logic-pad/core';

export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

// An empty locale to be replaced by real locales using `activeteLocale`
export const i18n = setupI18n({
  locale: DEFAULT_LOCALE,
  messages: { [DEFAULT_LOCALE]: {} },
});

export function isSupportedLocale(value: unknown): value is Locale {
  return (SUPPORTED_LOCALES as readonly unknown[]).includes(value);
}

// The Vite plugin compiles these .po catalogs to JS on demand, so each locale
// ends up in its own chunk and only the active one is fetched.
async function loadUiCatalog(locale: Locale): Promise<Record<string, string>> {
  const module = (await import(`./${locale}/messages.po`)) as {
    messages: Record<string, string>;
  };
  return module.messages;
}

const coreCatalogs: Record<Locale, () => Promise<{ default: CoreLocale }>> = {
  en: () => import('@logic-pad/core/locale/en'),
  ja: () => import('@logic-pad/core/locale/ja'),
};

type Catalogs = {
  messages: Record<string, string>;
  core: CoreLocale;
};

const loaded = new Map<Locale, Promise<Catalogs>>();

function loadCatalogs(locale: Locale): Promise<Catalogs> {
  const pending = loaded.get(locale);
  if (pending) return pending;

  const task = (async () => {
    const [messages, core] = await Promise.all([
      loadUiCatalog(locale),
      coreCatalogs[locale](),
    ]);
    return { messages, core: core.default };
  })();

  loaded.set(locale, task);
  task.catch(() => {
    // A failed load must not be cached, or the locale is dead for the session.
    if (loaded.get(locale) === task) loaded.delete(locale);
  });
  return task;
}

/**
 * Make `locale` active for both the UI and `@logic-pad/core` strings.
 *
 * Safe to call repeatedly, including for the locale that is already active.
 */
export async function activateLocale(locale: Locale): Promise<void> {
  const { messages, core } = await loadCatalogs(locale);
  i18n.load(locale, messages);
  i18n.activate(locale);
  setCoreLocale(core);
}

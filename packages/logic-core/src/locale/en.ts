import { setupI18n } from '@lingui/core';
import { messages } from './catalogs/en/messages.js';
import type { Locale } from './index.js';

export const locale: Locale = {
  code: 'en',
  i18n: setupI18n({ locale: 'en', messages: { en: messages } }),
};

export default locale;

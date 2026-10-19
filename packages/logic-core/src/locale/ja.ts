import { setupI18n } from '@lingui/core';
import { messages } from './catalogs/ja/messages.js';
import type { Locale } from './index.js';

export const locale: Locale = {
  code: 'ja',
  i18n: setupI18n({ locale: 'ja', messages: { ja: messages } }),
};

export default locale;

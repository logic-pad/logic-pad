import { setupI18n } from '@lingui/core';
import { messages } from './catalogs/en/messages';

export const i18n = setupI18n({ locale: 'en', messages: { en: messages } });

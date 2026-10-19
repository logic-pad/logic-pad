import { setupI18n } from '@lingui/core';
import { messages } from './catalogs/ja/messages';

export const i18n = setupI18n({ locale: 'ja', messages: { ja: messages } });

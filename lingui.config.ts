import { defineConfig } from '@lingui/cli';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'ja'],
  catalogs: [
    {
      path: 'src/client/locales/{locale}/messages',
      include: ['src/client'],
    },
  ],
});

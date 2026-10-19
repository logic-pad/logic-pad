import { defineConfig } from '@lingui/cli';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'ja'],
  catalogs: [
    {
      path: 'src/client/locales/{locale}/messages',
      include: ['src/client'],
    },
    {
      path: 'src/ssr/locales/catalogs/{locale}/messages',
      include: ['src/ssr'],
      exclude: ['src/ssr/locales/catalogs'],
    },
  ],
});

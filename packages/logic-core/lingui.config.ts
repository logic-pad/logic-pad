import { defineConfig } from '@lingui/cli';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'ja'],
  catalogs: [
    {
      path: 'src/locale/catalogs/{locale}/messages',
      include: ['src'],
      exclude: ['src/locale/catalogs'],
    },
  ],
});

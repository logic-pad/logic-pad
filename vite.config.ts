import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { replaceCodePlugin } from 'vite-plugin-replace';
import { execSync } from 'child_process';
import vercel from 'vite-plugin-vercel';

const commitHash = execSync('git rev-parse HEAD').toString().trim();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    replaceCodePlugin({
      replacements: [
        {
          from: /['"]vite-apply-code-mod['"].*/s,
          to: (source: string) => {
            // 'js' extension is required when @logic-pad/core is compiled by tsc
            // but vite uses 'ts' extension for worker imports
            return source.replaceAll('Worker.js', 'Worker.ts');
          },
        },
      ],
    }),
    react(),
    tanstackRouter({
      routesDirectory: './src/client/routes',
      generatedRouteTree: './src/client/router/routeTree.gen.ts',
    }),
    vercel(),
    VitePWA({
      registerType: 'prompt',
      outDir: '.vercel/output/static',
      includeAssets: ['favicon.ico', '*.svg', '*.png'],
      workbox: {
        globIgnores: ['**/node_modules/**/*', '**/_moderator*'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/, /^\/robots.txt/, /^\/sitemap.xml/],
      },
      manifest: {
        name: 'Logic Pad',
        short_name: 'Logic Pad',
        description: 'A modern, open-source web app for grid-based puzzles.',
        theme_color: '#414558',
        background_color: '#edeff7',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: 'lysine',
            project: 'logic-pad',
            telemetry: false,
            release: {
              name: commitHash,
            },
          }),
        ]
      : []),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), './', '../logic-core'], // allow serving files from the logic-core package for local testing
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
    port: 5173,
    open: true,
  },
  vercel: {
    additionalEndpoints: [
      {
        source: './src/ssr/index.ts',
        destination: '/ssr/[[...path]]',
        isr: { expiration: 60 * 60 },
        buildOptions: {
          loader: {
            '.node': 'copy',
            '.ttf': 'file',
            '.html': 'text',
          },
        },
      },
    ],
    rewrites: [
      { source: '/solve/:puzzleId', destination: '/ssr/solve/:puzzleId' },
      {
        source: '/api/preview/:type/:resourceId',
        destination: '/ssr/api/preview/:type/:resourceId',
      },
      { source: '/sitemap.xml', destination: '/ssr/sitemap.xml' },
      { source: '/((?!ssr).*)', destination: '/' },
    ],
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ],
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
    port: 5173,
    open: false,
  },
  optimizeDeps: {
    exclude: ['@logic-pad/core', 'logic-pad-solver-core'],
    include: ['event-iterator'],
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      external: [
        '@terrazzo/tiles',
        '@terrazzo/react-color-picker',
        '@terrazzo/use-color',
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: '@logic-pad/core/assets',
        replacement: path.join(
          searchForWorkspaceRoot(process.cwd()),
          './packages/logic-core/assets'
        ),
      },
      {
        find: '@logic-pad/core',
        replacement: path.join(
          searchForWorkspaceRoot(process.cwd()),
          './packages/logic-core/src'
        ),
      },
    ],
  },
  define: {
    'import.meta.env.VITE_PACKAGE_VERSION': JSON.stringify(commitHash),
  },
});

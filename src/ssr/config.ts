import { readFileSync } from 'node:fs';

/**
 * Public origin of the site, used to build absolute URLs (e.g. og:image).
 */
export const SITE_URL =
  process.env.SITE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

/**
 * Headers required for SharedArrayBuffer / WASM threads in the client.
 */
export const SECURITY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

/** The built client entry point, read once at startup. */
export const indexHtml = readFileSync(
  new URL('../../dist/index.html', import.meta.url),
  'utf8'
);

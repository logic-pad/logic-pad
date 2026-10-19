import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { sitemap } from './routes/sitemap';
import { ssr } from './routes/ssr';
import { image } from './routes/image';
import { indexHtml, SECURITY_HEADERS } from './config';

const port = Number(process.env.PORT ?? 3000);

// Routes owned by the ssr/image/sitemap plugins, which set their own headers.
// The `ja/` alternative covers the locale-prefixed twins of the SSR pages.
const pluginRoutes =
  /^\/(?:api\/|sitemap\.xml$|(?:ja\/)?(?:solve|collection|profile)\/)/;

// Filenames under /assets, and the workbox runtime, carry a content hash, so a
// given URL always maps to the same bytes and may be cached indefinitely.
const isContentHashed = (path: string) =>
  path.startsWith('/assets/') || /^\/workbox-[^/]+\.js(?:\.map)?$/.test(path);

// Everything else in dist/ (index.html, sw.js, the manifest, public files) keeps
// the same URL across deploys, so it must never be reused without validating it
// against the server. A cached index.html pins a page to asset URLs that the
// next deploy no longer serves, and a cached sw.js hides new deployments from
// the service worker's update check, so nothing is prefetched or prompted.
const cacheControlFor = (path: string) =>
  isContentHashed(path) ? 'public, max-age=31536000, immutable' : 'no-cache';

// Only document navigations may fall back to the SPA entry point. Asset and API
// requests must get a real 404: answering a missing .js request with index.html
// breaks the module on its MIME type (a blank page) and lets the service worker
// store HTML under an asset URL, poisoning its cache for the next deploy.
const isDocumentRequest = (request: Request) => {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith('/api/')) return false;
  if (!request.headers.get('accept')?.includes('text/html')) return false;
  return !pathname.slice(pathname.lastIndexOf('/') + 1).includes('.');
};

const app = new Elysia()
  .onRequest(({ request }) => {
    // Permanent redirect for `/en` pages to root (default locale)
    const url = new URL(request.url);
    const prefix = /^\/en(?=\/|$)/i.exec(url.pathname);
    if (!prefix) return;
    const rest = url.pathname.slice(prefix[0].length) || '/';
    return new Response(null, {
      status: 301,
      headers: { location: rest + url.search + url.hash },
    });
  })
  .mapResponse(({ path, response, set }) => {
    if (pluginRoutes.test(path)) return;
    const cacheControl = cacheControlFor(path);
    if (response instanceof Response) {
      // Never attach a cache policy to an error response.
      if (response.status >= 400) return;
      // set.headers appends to a header the static plugin already set, so the
      // value is replaced on the response itself instead.
      response.headers.set('cache-control', cacheControl);
    } else {
      // The plugin serves .html files straight off disk and never applies the
      // headers passed to it, so both the cache policy and the isolation
      // headers (required by the WASM solver) are added here.
      if (Number(set.status) >= 400) return;
      set.headers['cache-control'] = cacheControl;
      Object.assign(set.headers, SECURITY_HEADERS);
    }
  })
  .onError(({ code, error, request, set }) => {
    // SPA fallback: serve the client entry point for unknown GET pages,
    // letting TanStack Router handle routing on the client.
    if (
      code === 'NOT_FOUND' &&
      request.method === 'GET' &&
      isDocumentRequest(request)
    ) {
      set.status = 200;
      return new Response(indexHtml, {
        headers: {
          'content-type': 'text/html; charset=utf8',
          'cache-control': 'no-cache',
          ...SECURITY_HEADERS,
        },
      });
    }
    if (code !== 'NOT_FOUND') console.error(error);
  })
  .use(sitemap)
  .use(ssr)
  .use(image)
  .use(
    staticPlugin({
      assets: 'dist',
      prefix: '/',
      headers: SECURITY_HEADERS,
    })
  )
  .listen({ port, hostname: '0.0.0.0' });

console.log(
  `Logic Pad listening on ${app.server?.hostname}:${app.server?.port}`
);

export default app;

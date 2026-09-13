import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { sitemap } from './routes/sitemap';
import { ssr } from './routes/ssr';
import { image } from './routes/image';
import { indexHtml, SECURITY_HEADERS } from './config';

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  .onError(({ code, error, request, set }) => {
    // SPA fallback: serve the client entry point for unknown GET pages,
    // letting TanStack Router handle routing on the client.
    if (code === 'NOT_FOUND' && request.method === 'GET') {
      set.status = 200;
      return new Response(indexHtml, {
        headers: {
          'content-type': 'text/html; charset=utf8',
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

import { Elysia } from 'elysia';
import { node } from '@elysiajs/node';
import { sitemap } from './routes/sitemap';
import { ssr } from './routes/ssr';
import { image } from './routes/image';

const app = new Elysia({ adapter: node() })
  .onError(({ error }) => {
    console.error(error);
  })
  .use(sitemap)
  .use(ssr)
  .use(image);

export default app;

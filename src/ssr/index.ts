import { Elysia } from 'elysia';
import { sitemap } from './routes/sitemap';
import { ssr } from './routes/ssr';
import { image } from './routes/image';
import { axios } from '../client/online/api';

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const app = new Elysia()
  .onError(({ error }) => {
    console.error(error);
  })
  .use(sitemap)
  .use(ssr)
  .use(image);

export default app;

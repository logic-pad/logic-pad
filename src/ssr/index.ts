import axios from 'axios';
import { Elysia } from 'elysia';
import { sitemap } from './routes/sitemap';
import { ssr } from './routes/ssr';
import { image } from './routes/image';

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const app = new Elysia().group('/ssr', app =>
  app.use(sitemap).use(ssr).use(image)
);

export default app;

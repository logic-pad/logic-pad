import axios from 'axios';
import { Elysia } from 'elysia';
import { sitemap } from './routes/sitemap';
import { ssr } from './routes/ssr';
import { image } from './routes/image';

// TODO: A dirty hack to get around import.meta.env being undefined in vite-plugin-vercel v9
axios.defaults.baseURL = process.env.VITE_API_ENDPOINT;

const app = new Elysia().use(sitemap).use(ssr).use(image);

const handler = {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/ssr')) {
      const path = url.searchParams.get('path');
      if (path) {
        url.pathname = '/' + path;
        return app.fetch(new Request(url.toString(), request));
      }
    }
    return app.fetch(request);
  },
};

export default handler;

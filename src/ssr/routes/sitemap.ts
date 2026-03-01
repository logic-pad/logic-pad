import Elysia from 'elysia';
import { SitemapEntry } from '../../client/online/data';
import { SitemapStream } from 'sitemap';
import { createGzip } from 'zlib';
import { api } from '../../client/online/api';

const lastSitemapModification = new Date('2025-11-17T03:48:59Z');

function lastMod(updatedAt: string) {
  const updatedDate = new Date(updatedAt);
  return updatedDate > lastSitemapModification
    ? updatedAt
    : lastSitemapModification.toISOString();
}

export const sitemap = new Elysia()
  .mapResponse(({ responseValue }) => {
    return new Response(responseValue as BodyInit, {
      headers: {
        'content-type': 'text/xml',
        'content-encoding': 'gzip',
        'cache-control': 's-maxage=10, stale-while-revalidate',
        'x-robots-tag': 'index, follow',
      },
    });
  })
  .get('/sitemap.xml', async () => {
    const smStream = new SitemapStream({
      hostname: process.env.VITE_VERCEL_PROJECT_PRODUCTION_URL,
    });
    const pipeline = smStream.pipe(createGzip());

    // pipe your entries or directly write them.
    smStream.write({ url: '/', changefreq: 'hourly', priority: 1 });
    smStream.write({ url: '/create', changefreq: 'monthly', priority: 0.4 });
    smStream.write({
      url: '/search/puzzles',
      changefreq: 'hourly',
      priority: 1,
    });
    smStream.write({ url: '/uploader', changefreq: 'monthly', priority: 0.3 });
    smStream.write({ url: '/rules', changefreq: 'monthly', priority: 0.2 });
    smStream.write({ url: '/terms', changefreq: 'monthly', priority: 0.2 });
    smStream.write({
      url: '/privacy-policy',
      changefreq: 'monthly',
      priority: 0.2,
    });
    smStream.write({ url: '/auth', changefreq: 'monthly', priority: 0.5 });
    smStream.write({ url: '/support', changefreq: 'monthly', priority: 0.5 });

    let puzzles: SitemapEntry[] | null = null;
    let puzzleCount = 0;
    puzzlesLoop: while (puzzles === null || puzzles.length > 0) {
      puzzles = await api.listSitemap(
        'puzzles',
        undefined,
        puzzles?.at(-1)?.id
      );
      for (const puzzle of puzzles) {
        smStream.write({
          url: `/solve/${puzzle.id}`,
          lastmod: lastMod(puzzle.updatedAt),
          changefreq: 'weekly',
          priority: 0.6,
        });
        puzzleCount++;
        if (puzzleCount >= 25000) break puzzlesLoop;
      }
    }

    let collections: SitemapEntry[] | null = null;
    let collectionCount = 0;
    collectionsLoop: while (collections === null || collections.length > 0) {
      collections = await api.listSitemap(
        'collections',
        undefined,
        collections?.at(-1)?.id
      );
      for (const collection of collections) {
        smStream.write({
          url: `/collection/${collection.id}`,
          lastmod: lastMod(collection.updatedAt),
          changefreq: 'weekly',
          priority: 0.5,
        });
        collectionCount++;
        if (collectionCount >= 10000) break collectionsLoop;
      }
    }

    let users: SitemapEntry[] | null = null;
    let userCount = 0;
    usersLoop: while (users === null || users.length > 0) {
      users = await api.listSitemap('users', undefined, users?.at(-1)?.id);
      for (const user of users) {
        smStream.write({
          url: `/profile/${user.id}`,
          lastmod: lastMod(user.updatedAt),
          changefreq: 'weekly',
          priority: 0.4,
        });
        userCount++;
        if (userCount >= 10000) break usersLoop;
      }
    }

    // make sure to attach a write stream such as streamToPromise before ending
    smStream.end();
    // stream write the response
    return pipeline;
  });
